import { prisma } from "@/lib/prisma";
import { getTaxRulesForYear } from "./getTaxRules";

/**
 * Haalt de belastingregels op voor een bedrijf
 * Als er geen regels zijn, worden ze automatisch aangemaakt op basis van het jaar
 */
export async function getCompanyTaxRules(companyId: string) {
  // Haal eerst de company op om het jaar te weten
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { taxRules: true },
  });

  if (!company) {
    throw new Error("Bedrijf niet gevonden");
  }

  // Als er al regels zijn, retourneer die
  if (company.taxRules) {
    return company.taxRules;
  }

  // Anders: haal regels op voor dit jaar en sla op
  const taxRulesData = getTaxRulesForYear(company.year);

  const taxRules = await prisma.taxRules.create({
    data: {
      companyId: company.id,
      year: company.year,
      vatStandardRate: taxRulesData.vatStandardRate,
      vatReducedRate: taxRulesData.vatReducedRate,
      vatZeroRate: taxRulesData.vatZeroRate,
      incomeTaxRate1: taxRulesData.incomeTaxRate1,
      incomeTaxRate2: taxRulesData.incomeTaxRate2,
      incomeTaxRate3: taxRulesData.incomeTaxRate3,
      incomeTaxRate4: taxRulesData.incomeTaxRate4,
      incomeTaxBracket1: taxRulesData.incomeTaxBracket1,
      incomeTaxBracket2: taxRulesData.incomeTaxBracket2,
      incomeTaxBracket3: taxRulesData.incomeTaxBracket3,
      generalTaxCredit: taxRulesData.generalTaxCredit,
      employmentTaxCredit: taxRulesData.employmentTaxCredit,
      selfEmployedDeduction: taxRulesData.selfEmployedDeduction,
      smeProfitExemption: taxRulesData.smeProfitExemption,
      vatFilingFrequency: taxRulesData.vatFilingFrequency,
      source: taxRulesData.source || "belastingdienst",
      additionalRules: taxRulesData.additionalRules || {},
    },
  });

  return taxRules;
}

