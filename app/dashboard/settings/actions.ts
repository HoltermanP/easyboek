"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTaxRulesForYear } from "@/services/tax/getTaxRules";

export async function createCompany(formData: FormData) {
  const user = await requireAuth();
  
  const name = formData.get("name") as string;
  const year = formData.get("year") as string;
  const kvkNumber = formData.get("kvkNumber") as string | null;
  const btwNumber = formData.get("btwNumber") as string | null;

  if (!name || !year) {
    return { error: "Bedrijfsnaam en jaar zijn verplicht" };
  }

  const yearInt = parseInt(year);
  if (isNaN(yearInt) || yearInt < 2020 || yearInt > 2100) {
    return { error: "Ongeldig jaar" };
  }

  // Check if company for this year already exists
  const existingCompany = await prisma.company.findFirst({
    where: {
      ownerId: user.id,
      year: yearInt,
    },
  });

  if (existingCompany) {
    return { error: `Er bestaat al een administratie voor ${yearInt}` };
  }

  try {
    const company = await prisma.company.create({
      data: {
        ownerId: user.id,
        name,
        year: yearInt,
        kvkNumber: kvkNumber || null,
        btwNumber: btwNumber || null,
      },
    });

    // Maak standaard grootboekrekeningen aan
    const { STANDARD_LEDGER_ACCOUNTS } = await import("@/lib/ledgerAccounts");
    
    await prisma.ledgerAccount.createMany({
      data: STANDARD_LEDGER_ACCOUNTS.map((acc) => ({
        companyId: company.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
      })),
      skipDuplicates: true,
    });

    // Haal belastingregels op voor dit jaar en sla op
    const taxRules = getTaxRulesForYear(yearInt);
    await prisma.taxRules.create({
      data: {
        companyId: company.id,
        year: yearInt,
        vatStandardRate: taxRules.vatStandardRate,
        vatReducedRate: taxRules.vatReducedRate,
        vatZeroRate: taxRules.vatZeroRate,
        incomeTaxRate1: taxRules.incomeTaxRate1,
        incomeTaxRate2: taxRules.incomeTaxRate2,
        incomeTaxRate3: taxRules.incomeTaxRate3,
        incomeTaxRate4: taxRules.incomeTaxRate4,
        incomeTaxBracket1: taxRules.incomeTaxBracket1,
        incomeTaxBracket2: taxRules.incomeTaxBracket2,
        incomeTaxBracket3: taxRules.incomeTaxBracket3,
        generalTaxCredit: taxRules.generalTaxCredit,
        employmentTaxCredit: taxRules.employmentTaxCredit,
        selfEmployedDeduction: taxRules.selfEmployedDeduction,
        smeProfitExemption: taxRules.smeProfitExemption,
        vatFilingFrequency: taxRules.vatFilingFrequency,
        source: taxRules.source || "belastingdienst",
        additionalRules: taxRules.additionalRules || {},
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    
    return { success: true, company };
  } catch (error) {
    console.error("Error creating company:", error);
    return { error: "Fout bij aanmaken bedrijf" };
  }
}

export async function updateCompany(formData: FormData) {
  const user = await requireAuth();
  
  const companyId = formData.get("companyId") as string;
  const name = formData.get("name") as string;
  const kvkNumber = formData.get("kvkNumber") as string | null;
  const btwNumber = formData.get("btwNumber") as string | null;

  if (!companyId || !name) {
    throw new Error("Bedrijfsnaam is verplicht");
  }

  // Check if user owns the company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    throw new Error("Bedrijf niet gevonden");
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        kvkNumber: kvkNumber || null,
        btwNumber: btwNumber || null,
      },
    });

    revalidatePath("/dashboard/settings");
  } catch (error) {
    console.error("Error updating company:", error);
    throw error instanceof Error ? error : new Error("Fout bij bijwerken bedrijf");
  }
}

/**
 * Verwijder alle data voor een bepaalde periode binnen een administratie
 */
export async function deletePeriodData(formData: FormData) {
  const user = await requireAuth();
  
  const companyId = formData.get("companyId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!companyId || !startDate || !endDate) {
    return { error: "Alle velden zijn verplicht" };
  }

  // Check if user owns the company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    return { error: "Bedrijf niet gevonden" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  try {
    // Verwijder boekingen in periode
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        companyId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Verwijder facturen in periode
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        companyId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Verwijder documenten in periode
    const deletedDocuments = await prisma.transactionDocument.deleteMany({
      where: {
        companyId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/documents");

    return { 
      success: true,
      deleted: {
        bookings: deletedBookings.count,
        invoices: deletedInvoices.count,
        documents: deletedDocuments.count,
      },
    };
  } catch (error) {
    console.error("Error deleting period data:", error);
    return { error: "Fout bij verwijderen periode data" };
  }
}

/**
 * Selecteer een administratie (sla op in cookie)
 */
export async function selectCompany(formData: FormData) {
  const user = await requireAuth();
  
  const companyId = formData.get("companyId") as string;

  if (!companyId) {
    return { error: "Company ID is verplicht" };
  }

  // Check if user owns the company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    return { error: "Bedrijf niet gevonden" };
  }

  // Set cookie (dit moet via headers in een route handler, maar voor nu gebruiken we revalidate)
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  
  return { success: true, companyId };
}
