"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanyTaxRules } from "@/services/tax/getCompanyTaxRules";
import { calculateAmountExclVat, calculateVatAmount } from "@/services/tax/calculateVat";

export async function createBookingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const documentId = formData.get("documentId") as string;
  const companyId = formData.get("companyId") as string;
  const debitAccountId = formData.get("debitAccountId") as string;
  const bankAccountId = formData.get("bankAccountId") as string;
  const amountInclVat = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const date = new Date(formData.get("date") as string);
  const vatCode = formData.get("vatCode") as string | null;
  const isBusinessConfirmed = formData.get("isBusinessConfirmed") === "true";

  if (!documentId || !companyId || !debitAccountId || !bankAccountId || !amountInclVat || !description) {
    throw new Error("Alle velden zijn verplicht");
  }

  // Check of dit representatiekosten zijn (4680) - vereis bevestiging
  const debitAccount = await prisma.ledgerAccount.findUnique({
    where: { id: debitAccountId },
  });

  if (debitAccount?.code === "4680" && !isBusinessConfirmed) {
    throw new Error("Bevestiging vereist: Is deze uitgave zakelijk?");
  }

  try {
    // Verify document belongs to user's company
    const document = await prisma.transactionDocument.findFirst({
      where: {
        id: documentId,
        companyId: companyId,
      },
    });

    if (!document) {
      throw new Error("Document niet gevonden");
    }

    // Bereken BTW bedragen
    let amountExclVat = amountInclVat;
    let vatAmount = 0;
    let finalVatCode: string | null = null;

    if (vatCode && vatCode !== "") {
      finalVatCode = vatCode;
      // Bereken bedrag excl. BTW
      amountExclVat = await calculateAmountExclVat(amountInclVat, vatCode, companyId);
      // BTW bedrag = verschil tussen incl. en excl. BTW (nauwkeuriger dan berekening)
      vatAmount = amountInclVat - amountExclVat;
    }

    // Zoek of maak BTW te vorderen rekening (1510) als er BTW is
    let btwTeVorderenAccount = null;
    if (vatAmount > 0) {
      btwTeVorderenAccount = await prisma.ledgerAccount.findFirst({
        where: {
          companyId: companyId,
          code: "1510",
        },
      });

      if (!btwTeVorderenAccount) {
        btwTeVorderenAccount = await prisma.ledgerAccount.create({
          data: {
            companyId: companyId,
            code: "1510",
            name: "BTW te vorderen",
            type: "balance",
          },
        });
      }
    }

    // Boeking 1: Kostenrekening debet, Bank credit (bedrag excl. BTW)
    await prisma.booking.create({
      data: {
        companyId: companyId,
        date: date,
        description: description,
        debitAccountId: debitAccountId,
        creditAccountId: bankAccountId,
        amount: amountExclVat,
        vatCode: finalVatCode,
        createdBy: user.id,
      },
    });

    // Boeking 2: BTW te vorderen debet, Bank credit (BTW bedrag) - alleen als er BTW is
    if (vatAmount > 0 && btwTeVorderenAccount) {
      await prisma.booking.create({
        data: {
          companyId: companyId,
          date: date,
          description: `${description} (BTW)`,
          debitAccountId: btwTeVorderenAccount.id, // BTW te vorderen (activa) debet
          creditAccountId: bankAccountId, // Bank credit
          amount: vatAmount, // BTW bedrag
          vatCode: finalVatCode,
          createdBy: user.id,
        },
      });
    }

    // Update document status
    await prisma.transactionDocument.update({
      where: { id: documentId },
      data: {
        status: "booked",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/bookings");

    redirect("/dashboard/bookings");
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error instanceof Error ? error : new Error("Fout bij aanmaken boeking");
  }
}



