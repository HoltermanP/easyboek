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

  // Bereken omzet belasting (BTW over verkopen) uit facturen
  let omzetBelasting = 0;
  for (const invoice of invoices) {
    omzetBelasting += Number(invoice.vatTotal);
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

  // Voorbelasting = som van alle BTW boekingen op rekening 1510
  let voorbelasting = 0;
  for (const booking of vatTeVorderenBookings) {
    voorbelasting += Number(booking.amount);
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

  // Haal belastingregels op voor context
  const taxRules = await getCompanyTaxRules(companyId);

  return {
    omzetBelasting,
    voorbelasting,
    teBetalen,
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



