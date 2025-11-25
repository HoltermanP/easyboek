import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processOCR } from "@/services/ocr/ocr";
import { categorizeDocument } from "@/services/ai/categorize";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and company
    const userWithCompanies = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companies: true,
      },
    });

    if (!userWithCompanies || userWithCompanies.companies.length === 0) {
      return NextResponse.json(
        { error: "Geen bedrijf gevonden. Maak eerst een bedrijf aan." },
        { status: 400 }
      );
    }

    const company = userWithCompanies.companies[0];

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = (formData.get("type") as string) || "receipt";

    if (!file) {
      return NextResponse.json({ error: "Geen bestand geüpload" }, { status: 400 });
    }

    // Valideer file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Alleen PDF, JPG en PNG bestanden zijn toegestaan" },
        { status: 400 }
      );
    }

    // Valideer file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Bestand is te groot (max 4MB)" },
        { status: 400 }
      );
    }

    // Maak uploads directory aan als deze niet bestaat
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Genereer unieke bestandsnaam
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Schrijf bestand naar disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retourneer URL
    const fileUrl = `/uploads/${fileName}`;

    // Process OCR en categorisatie
    let ocrText: string | null = null;
    let aiCategory: string | null = null;
    let suggestedLedger: number | null = null;
    let extractedAmount: number | undefined = undefined;
    let extractedDate: string | undefined = undefined;
    let vendor: string | undefined = undefined;
    let vatPercentage: number | undefined = undefined;
    let vatAmount: number | undefined = undefined;
    let amountExclVat: number | undefined = undefined;

    try {
      // Process OCR
      const ocrResult = await processOCR(fileUrl);
      ocrText = ocrResult.ocrText;

      // Categorize met AI (één keer aanroepen, alle info ophalen)
      if (ocrText && ocrText.trim().length > 0) {
        const categoryResult = await categorizeDocument(ocrText);
        aiCategory = categoryResult.category;
        suggestedLedger = categoryResult.suggestedLedger;
        extractedAmount = categoryResult.extractedAmount;
        extractedDate = categoryResult.extractedDate;
        vendor = categoryResult.vendor;
        vatPercentage = categoryResult.vatPercentage;
        vatAmount = categoryResult.vatAmount;
        amountExclVat = categoryResult.amountExclVat;
        
        console.log(`AI categorisatie: ${aiCategory}, Rekening: ${suggestedLedger}, Bedrag: ${extractedAmount || "niet gevonden"}, BTW: ${vatPercentage || "geen"}% (€${vatAmount || 0})`);
      }
    } catch (error) {
      console.error("OCR/Categorization error:", error);
      // Continue even if OCR fails
    }
    
    // Als OCR faalt, gebruik default categorisatie op basis van document type
    if (!aiCategory && !suggestedLedger) {
      if (documentType === "receipt") {
        aiCategory = "overige-kosten";
        suggestedLedger = 4690;
      } else if (documentType === "invoice") {
        aiCategory = "inkomsten";
        suggestedLedger = 8000;
      } else {
        aiCategory = "overige-kosten";
        suggestedLedger = 4690;
      }
    }

    // Save to database
    const document = await prisma.transactionDocument.create({
      data: {
        companyId: company.id,
        url: fileUrl,
        originalFilename: file.name,
        type: documentType,
        ocrText: ocrText,
        aiCategory: aiCategory,
        status: ocrText ? "processed" : "uploaded",
      },
    });

    // Create booking draft if we have category and ledger suggestion
    let bookingDraft = null;
    if (aiCategory && suggestedLedger) {
      try {
        // Find or create the suggested ledger account
        let ledgerAccount = await prisma.ledgerAccount.findFirst({
          where: {
            companyId: company.id,
            code: suggestedLedger.toString(),
          },
        });

        if (!ledgerAccount) {
          // Create default ledger account if it doesn't exist
          ledgerAccount = await prisma.ledgerAccount.create({
            data: {
              companyId: company.id,
              code: suggestedLedger.toString(),
              name: `Rekening ${suggestedLedger}`,
              type: suggestedLedger >= 4000 && suggestedLedger < 8000 ? "result" : "balance",
            },
          });
        }

        // Find bank account (default 1000)
        let bankAccount = await prisma.ledgerAccount.findFirst({
          where: {
            companyId: company.id,
            code: "1000",
          },
        });

        if (!bankAccount) {
          bankAccount = await prisma.ledgerAccount.create({
            data: {
              companyId: company.id,
              code: "1000",
              name: "Bank",
              type: "balance",
            },
          });
        }

        // Extract amount - gebruik AI geëxtraheerd bedrag of probeer regex
        let amount = 0;

        if (extractedAmount && extractedAmount > 0) {
          amount = extractedAmount;
          console.log(`AI geëxtraheerd bedrag gebruikt: €${amount}`);
        } else if (ocrText) {
          // Fallback: extract amount from OCR text (improved regex)
          // Zoek naar bedragen in formaten zoals: €123,45, 123.45, 123,45 EUR, etc.
          const amountPatterns = [
            /Totaal[:\s]*€?\s*(\d+[.,]\d{2})/i, // Totaal: €123,45 (prioriteit)
            /Bedrag[:\s]*€?\s*(\d+[.,]\d{2})/i, // Bedrag: €123,45 (prioriteit)
            /€\s*(\d+[.,]\d{2})/,           // €123,45
            /EUR\s*(\d+[.,]\d{2})/,         // EUR 123,45
            /(\d+[.,]\d{2})\s*€/,           // 123,45 €
          ];

          // Probeer eerst specifieke patronen (Totaal, Bedrag)
          for (const pattern of amountPatterns.slice(0, 2)) {
            const match = ocrText.match(pattern);
            if (match) {
              const foundAmount = parseFloat(match[1].replace(",", "."));
              if (foundAmount > 0 && foundAmount < 100000) { // Redelijke limiet
                amount = foundAmount;
                console.log(`Bedrag gevonden via regex: €${amount}`);
                break;
              }
            }
          }

          // Als nog geen bedrag gevonden, probeer algemene patronen
          if (amount === 0) {
            for (const pattern of amountPatterns.slice(2)) {
              const match = ocrText.match(pattern);
              if (match) {
                const foundAmount = parseFloat(match[1].replace(",", "."));
                if (foundAmount > amount && foundAmount < 100000) {
                  amount = foundAmount;
                }
              }
            }
            if (amount > 0) {
              console.log(`Bedrag gevonden via regex (algemeen): €${amount}`);
            }
          }
        }

        // Alleen boeking aanmaken als er een geldig bedrag gevonden is
        // Geen automatische boeking met 0.01 - gebruiker moet handmatig boeken
        if (amount > 0 && amount >= 0.01) {
          // Bepaal bedragen: gebruik AI geëxtraheerde waarden of bereken
          const totalAmount = amount; // Totaal incl. BTW
          const costAmount = amountExclVat || (vatAmount ? totalAmount - vatAmount : totalAmount); // Bedrag excl. BTW
          const bookingVatAmount = vatAmount || 0; // BTW bedrag
          
          // Haal belastingregels op voor juiste BTW tarieven
          const { getCompanyTaxRules } = await import("@/services/tax/getCompanyTaxRules");
          const taxRules = await getCompanyTaxRules(company.id);
          const standardRate = Number(taxRules.vatStandardRate);
          const reducedRate = Number(taxRules.vatReducedRate);
          const zeroRate = Number(taxRules.vatZeroRate);

          // Bepaal BTW code voor de boeking op basis van geldende tarieven
          let vatCode: string | null = null;
          if (vatPercentage !== undefined) {
            // Vergelijk met geldende tarieven (met kleine marge voor afronding)
            if (Math.abs(vatPercentage - standardRate) < 0.1) vatCode = "HOOG";
            else if (Math.abs(vatPercentage - reducedRate) < 0.1) vatCode = "LAAG";
            else if (Math.abs(vatPercentage - zeroRate) < 0.1) vatCode = "NUL";
            else {
              // Fallback naar oude codes voor backwards compatibility
              if (vatPercentage === 21) vatCode = "21";
              else if (vatPercentage === 9) vatCode = "9";
              else if (vatPercentage === 0) vatCode = "0";
            }
          }

          // Maak een duidelijke omschrijving
          let description = "";
          if (vendor) {
            description = `${vendor} - ${aiCategory}`;
          } else {
            description = `${aiCategory} - ${file.name}`;
          }
          
          // Voeg datum toe als beschikbaar
          const bookingDate = extractedDate ? new Date(extractedDate) : new Date();
          if (extractedDate) {
            try {
              const date = new Date(extractedDate);
              if (!isNaN(date.getTime())) {
                description = `${description} (${date.toLocaleDateString("nl-NL")})`;
              }
            } catch (e) {
              // Ignore date parsing errors
            }
          }

          // Zoek of maak BTW te vorderen rekening (1510) als er BTW is
          let btwTeVorderenAccount = null;
          if (bookingVatAmount > 0) {
            btwTeVorderenAccount = await prisma.ledgerAccount.findFirst({
              where: {
                companyId: company.id,
                code: "1510",
              },
            });

            if (!btwTeVorderenAccount) {
              btwTeVorderenAccount = await prisma.ledgerAccount.create({
                data: {
                  companyId: company.id,
                  code: "1510",
                  name: "BTW te vorderen",
                  type: "balance",
                },
              });
            }
          }

          // Boeking 1: Kostenrekening debet, Bank credit (bedrag excl. BTW)
          bookingDraft = await prisma.booking.create({
            data: {
              companyId: company.id,
              date: bookingDate,
              description: description,
              debitAccountId: ledgerAccount.id, // Kosten rekening (4xxx) debet
              creditAccountId: bankAccount.id, // Bank credit
              amount: costAmount, // Bedrag excl. BTW
              vatCode: vatCode, // BTW code voor voorbelasting berekening
              createdBy: user.id,
            },
          });

          // Boeking 2: BTW te vorderen debet, Bank credit (BTW bedrag) - alleen als er BTW is
          if (bookingVatAmount > 0 && btwTeVorderenAccount) {
            await prisma.booking.create({
              data: {
                companyId: company.id,
                date: bookingDate,
                description: `${description} (BTW)`,
                debitAccountId: btwTeVorderenAccount.id, // BTW te vorderen (activa) debet
                creditAccountId: bankAccount.id, // Bank credit
                amount: bookingVatAmount, // BTW bedrag
                vatCode: vatCode,
                createdBy: user.id,
              },
            });
            console.log(`BTW voorbelasting geboekt: €${bookingVatAmount} op BTW te vorderen (${vatCode || "geen code"}%)`);
          }

          // Update document status
          await prisma.transactionDocument.update({
            where: { id: document.id },
            data: {
              status: "booked",
            },
          });
          
          console.log(`Boeking aangemaakt: Kosten €${costAmount} (excl. BTW) op rekening ${ledgerAccount.code}, Totaal incl. BTW: €${totalAmount}`);
        } else {
          console.log(`Geen geldig bedrag gevonden (${amount}), boeking niet automatisch aangemaakt. Gebruiker kan handmatig boeken.`);
        }
      } catch (error) {
        console.error("Error creating booking draft:", error);
        // Continue even if booking creation fails
      }
    } else {
      console.log(`Geen categorie of ledger suggestie, boeking niet automatisch aangemaakt.`);
    }

    // Haal grootboekrekening details op als boeking is aangemaakt
    let ledgerCode = null;
    let ledgerName = null;
    let bookingAmount = null;
    let bookingDate = null;
    let bookingDescription = null;
    
    if (bookingDraft) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingDraft.id },
        include: {
          debitAccount: true,
        },
      });
      if (booking) {
        ledgerCode = booking.debitAccount.code;
        ledgerName = booking.debitAccount.name;
        bookingAmount = Number(booking.amount);
        bookingDate = booking.date.toISOString();
        bookingDescription = booking.description;
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
      documentId: document.id,
      ocrText: ocrText,
      category: aiCategory,
      bookingCreated: bookingDraft !== null,
      // Extra details
      extractedAmount: extractedAmount || null,
      extractedDate: extractedDate || null,
      vendor: vendor || null,
      suggestedLedger: suggestedLedger || null,
      vatPercentage: vatPercentage || null,
      vatAmount: vatAmount || null,
      amountExclVat: amountExclVat || null,
      // Boeking details (als aangemaakt)
      bookingDetails: bookingDraft ? {
        amount: bookingAmount,
        date: bookingDate,
        description: bookingDescription,
        ledgerCode: ledgerCode,
        ledgerName: ledgerName,
      } : null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Fout bij uploaden bestand" },
      { status: 500 }
    );
  }
}
