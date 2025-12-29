import { prisma } from "@/lib/prisma";
import { getCompanyTaxRules } from "@/services/tax/getCompanyTaxRules";

/**
 * Haalt alle boekingen op met BTW voor een bepaalde periode
 */
export async function getVatBookings(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const bookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      vatCode: {
        not: null,
      },
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return bookings;
}

/**
 * Berekent BTW overzicht voor een periode
 * Gebruikt facturen voor omzet BTW en boekingen met BTW codes voor kosten BTW
 */
export async function calculateVatOverview(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  // Haal belastingregels op eerst (nodig voor categorisatie)
  const taxRules = await getCompanyTaxRules(companyId);
  const standardRate = Number(taxRules.vatStandardRate);
  const reducedRate = Number(taxRules.vatReducedRate);
  const zeroRate = Number(taxRules.vatZeroRate);

  // Haal facturen op voor omzet BTW (BTW te ontvangen)
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Bereken omzet belasting (BTW over verkopen) uit facturen - per categorie
  let omzetBelasting = 0;
  let omzetBelastingHoog = 0; // 21% / HOOG
  let omzetBelastingLaag = 0; // 9% / LAAG
  let omzetBelastingNul = 0; // 0% / NUL
  
  for (const invoice of invoices) {
    const invoiceVatTotal = Number(invoice.vatTotal);
    omzetBelasting += invoiceVatTotal;
    
    // Parse invoice items (JSON) om BTW per categorie te berekenen
    try {
      const items = invoice.items as Array<{ description: string; quantity: number; price: number; vat: number }>;
      if (Array.isArray(items)) {
        for (const item of items) {
          const itemVat = item.vat || 0;
          const itemTotal = item.quantity * item.price;
          const itemVatAmount = itemTotal * (itemVat / 100);
          
          // Categoriseer op basis van BTW percentage
          if (Math.abs(itemVat - standardRate) < 0.01) {
            omzetBelastingHoog += itemVatAmount;
          } else if (Math.abs(itemVat - reducedRate) < 0.01) {
            omzetBelastingLaag += itemVatAmount;
          } else if (Math.abs(itemVat - zeroRate) < 0.01 || itemVat === 0) {
            omzetBelastingNul += itemVatAmount;
          } else {
            // Fallback: als percentage niet exact matcht, gebruik standaard
            omzetBelastingHoog += itemVatAmount;
          }
        }
      } else {
        // Als items niet parsebaar zijn, verdeel totaal BTW proportioneel (fallback)
        omzetBelastingHoog += invoiceVatTotal;
      }
    } catch (error) {
      // Fallback: als parsing faalt, tel bij hoog tarief
      omzetBelastingHoog += invoiceVatTotal;
    }
  }

  // Haal BTW boekingen op rekening 1510 (BTW te vorderen) - dit zijn de voorbelasting boekingen
  const vatTeVorderenBookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      debitAccount: {
        code: "1510", // BTW te vorderen
      },
    },
    include: {
      debitAccount: true,
    },
  });

  // Voorbelasting = som van alle BTW boekingen op rekening 1510 - per categorie
  let voorbelasting = 0;
  let voorbelastingHoog = 0; // 21% / HOOG
  let voorbelastingLaag = 0; // 9% / LAAG
  let voorbelastingNul = 0; // 0% / NUL
  
  for (const booking of vatTeVorderenBookings) {
    const bookingAmount = Number(booking.amount);
    voorbelasting += bookingAmount;
    
    // Categoriseer op basis van vatCode
    const vatCode = booking.vatCode?.toUpperCase() || "";
    if (vatCode === "HOOG" || vatCode === "21" || vatCode === "21%") {
      voorbelastingHoog += bookingAmount;
    } else if (vatCode === "LAAG" || vatCode === "9" || vatCode === "9%") {
      voorbelastingLaag += bookingAmount;
    } else if (vatCode === "NUL" || vatCode === "0" || vatCode === "0%") {
      voorbelastingNul += bookingAmount;
    } else {
      // Fallback: als code niet herkend wordt, gebruik hoog tarief
      voorbelastingHoog += bookingAmount;
    }
  }

  // Haal ook kostenboekingen op met BTW codes (voor overzicht, maar gebruik 1510 boekingen voor berekening)
  const costBookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      debitAccount: {
        code: {
          startsWith: "4", // Kosten rekeningen
        },
      },
      vatCode: {
        not: null,
      },
    },
    include: {
      debitAccount: true,
    },
  });

  const teBetalen = omzetBelasting - voorbelasting;

  // BTW per categorie voor te betalen
  const teBetalenHoog = omzetBelastingHoog - voorbelastingHoog;
  const teBetalenLaag = omzetBelastingLaag - voorbelastingLaag;
  const teBetalenNul = omzetBelastingNul - voorbelastingNul;

  return {
    omzetBelasting,
    voorbelasting,
    teBetalen,
    // BTW per categorie
    omzetBelastingPerCategorie: {
      hoog: omzetBelastingHoog,
      laag: omzetBelastingLaag,
      nul: omzetBelastingNul,
    },
    voorbelastingPerCategorie: {
      hoog: voorbelastingHoog,
      laag: voorbelastingLaag,
      nul: voorbelastingNul,
    },
    teBetalenPerCategorie: {
      hoog: teBetalenHoog,
      laag: teBetalenLaag,
      nul: teBetalenNul,
    },
    invoices,
    costBookings,
    vatTeVorderenBookings, // BTW boekingen voor voorbelasting
    taxRules: {
      standardRate: Number(taxRules.vatStandardRate),
      reducedRate: Number(taxRules.vatReducedRate),
      zeroRate: Number(taxRules.vatZeroRate),
      filingFrequency: taxRules.vatFilingFrequency,
    },
  };
}



