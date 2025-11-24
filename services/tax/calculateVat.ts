import { getCompanyTaxRules } from "./getCompanyTaxRules";

/**
 * Berekent BTW bedrag op basis van bedrag excl. BTW en BTW code
 */
export async function calculateVatAmount(
  amountExclVat: number,
  vatCode: "HOOG" | "LAAG" | "NUL" | string,
  companyId: string
): Promise<number> {
  const taxRules = await getCompanyTaxRules(companyId);
  
  let vatRate = 0;
  
  if (vatCode === "HOOG" || vatCode === "21" || vatCode === "21%") {
    vatRate = Number(taxRules.vatStandardRate);
  } else if (vatCode === "LAAG" || vatCode === "9" || vatCode === "9%") {
    vatRate = Number(taxRules.vatReducedRate);
  } else if (vatCode === "NUL" || vatCode === "0" || vatCode === "0%") {
    vatRate = Number(taxRules.vatZeroRate);
  } else {
    // Default naar standaard tarief
    vatRate = Number(taxRules.vatStandardRate);
  }
  
  return (amountExclVat * vatRate) / 100;
}

/**
 * Berekent bedrag excl. BTW op basis van bedrag incl. BTW en BTW code
 */
export async function calculateAmountExclVat(
  amountInclVat: number,
  vatCode: "HOOG" | "LAAG" | "NUL" | string,
  companyId: string
): Promise<number> {
  const taxRules = await getCompanyTaxRules(companyId);
  
  let vatRate = 0;
  
  if (vatCode === "HOOG" || vatCode === "21" || vatCode === "21%") {
    vatRate = Number(taxRules.vatStandardRate);
  } else if (vatCode === "LAAG" || vatCode === "9" || vatCode === "9%") {
    vatRate = Number(taxRules.vatReducedRate);
  } else if (vatCode === "NUL" || vatCode === "0" || vatCode === "0%") {
    vatRate = Number(taxRules.vatZeroRate);
  } else {
    // Default naar standaard tarief
    vatRate = Number(taxRules.vatStandardRate);
  }
  
  return amountInclVat / (1 + vatRate / 100);
}

/**
 * Haalt BTW tarief op voor een specifieke BTW code
 */
export async function getVatRate(
  vatCode: "HOOG" | "LAAG" | "NUL" | string,
  companyId: string
): Promise<number> {
  const taxRules = await getCompanyTaxRules(companyId);
  
  if (vatCode === "HOOG" || vatCode === "21" || vatCode === "21%") {
    return Number(taxRules.vatStandardRate);
  } else if (vatCode === "LAAG" || vatCode === "9" || vatCode === "9%") {
    return Number(taxRules.vatReducedRate);
  } else if (vatCode === "NUL" || vatCode === "0" || vatCode === "0%") {
    return Number(taxRules.vatZeroRate);
  }
  
  // Default naar standaard tarief
  return Number(taxRules.vatStandardRate);
}

/**
 * Berekent BTW bedrag op basis van bedrag excl. BTW en BTW percentage
 */
export function calculateVatFromRate(amountExclVat: number, vatRate: number): number {
  return (amountExclVat * vatRate) / 100;
}

