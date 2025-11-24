/**
 * Service voor het ophalen van belastingregels per jaar
 * Gebruikt standaard Nederlandse belastingregels
 */

export interface TaxRulesData {
  year: number;
  vatStandardRate: number;
  vatReducedRate: number;
  vatZeroRate: number;
  incomeTaxRate1?: number;
  incomeTaxRate2?: number;
  incomeTaxRate3?: number;
  incomeTaxRate4?: number;
  incomeTaxBracket1?: number;
  incomeTaxBracket2?: number;
  incomeTaxBracket3?: number;
  generalTaxCredit?: number;
  employmentTaxCredit?: number;
  selfEmployedDeduction?: number;
  smeProfitExemption?: number;
  vatFilingFrequency: "monthly" | "quarterly" | "yearly";
  source?: string;
  additionalRules?: Record<string, any>;
}

/**
 * Haalt de belastingregels op voor een specifiek jaar
 * Gebruikt historische en actuele Nederlandse belastingregels
 */
export function getTaxRulesForYear(year: number): TaxRulesData {
  // Basis BTW tarieven (zijn relatief stabiel)
  const baseRules: TaxRulesData = {
    year,
    vatStandardRate: 21.0,
    vatReducedRate: 9.0,
    vatZeroRate: 0.0,
    vatFilingFrequency: "quarterly",
    source: "belastingdienst",
  };

  // Jaar-specifieke regels
  if (year >= 2025) {
    // 2025 en later - drie belastingschijven
    return {
      ...baseRules,
      // Inkomstenbelasting 2025: drie schijven
      incomeTaxRate1: 35.82,  // Eerste schijf
      incomeTaxRate2: 37.48,  // Tweede schijf
      incomeTaxRate3: 49.50,  // Derde schijf
      incomeTaxRate4: 49.50,  // Vierde schijf (boven derde)
      incomeTaxBracket1: 38441,   // Tot €38.441
      incomeTaxBracket2: 76817,   // Tot €76.817
      incomeTaxBracket3: 76817,   // Boven €76.817
      generalTaxCredit: 3068,      // Verlaagd van €3.362
      employmentTaxCredit: 5599,   // Verhoogd naar €5.599
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  } else if (year === 2024) {
    // 2024 - twee belastingschijven
    return {
      ...baseRules,
      incomeTaxRate1: 36.97,  // Eerste schijf
      incomeTaxRate2: 36.97,  // Tweede schijf (zelfde als eerste)
      incomeTaxRate3: 49.50,  // Derde schijf
      incomeTaxRate4: 49.50,  // Vierde schijf
      incomeTaxBracket1: 75518,   // Tot €75.518
      incomeTaxBracket2: 75518,   // Tot €75.518
      incomeTaxBracket3: 75518,   // Boven €75.518
      generalTaxCredit: 3362,      // €3.362
      employmentTaxCredit: 5532,   // €5.532
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  } else if (year === 2023) {
    return {
      ...baseRules,
      incomeTaxRate1: 36.93,
      incomeTaxRate2: 36.93,
      incomeTaxRate3: 49.50,
      incomeTaxRate4: 49.50,
      incomeTaxBracket1: 73031,
      incomeTaxBracket2: 73031,
      incomeTaxBracket3: 73031,
      generalTaxCredit: 3070,
      employmentTaxCredit: 0,
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  } else if (year === 2022) {
    return {
      ...baseRules,
      incomeTaxRate1: 37.07,
      incomeTaxRate2: 37.07,
      incomeTaxRate3: 49.50,
      incomeTaxRate4: 49.50,
      incomeTaxBracket1: 69408,
      incomeTaxBracket2: 69408,
      incomeTaxBracket3: 69408,
      generalTaxCredit: 2838,
      employmentTaxCredit: 0,
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  } else if (year === 2021) {
    return {
      ...baseRules,
      incomeTaxRate1: 37.10,
      incomeTaxRate2: 37.10,
      incomeTaxRate3: 49.50,
      incomeTaxRate4: 49.50,
      incomeTaxBracket1: 68508,
      incomeTaxBracket2: 68508,
      incomeTaxBracket3: 68508,
      generalTaxCredit: 2838,
      employmentTaxCredit: 0,
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  } else if (year === 2020) {
    return {
      ...baseRules,
      incomeTaxRate1: 37.35,
      incomeTaxRate2: 37.35,
      incomeTaxRate3: 49.50,
      incomeTaxRate4: 49.50,
      incomeTaxBracket1: 68508,
      incomeTaxBracket2: 68508,
      incomeTaxBracket3: 68508,
      generalTaxCredit: 2838,
      employmentTaxCredit: 0,
      selfEmployedDeduction: 5030,
      smeProfitExemption: 14.0,
    };
  }

  // Fallback voor oudere jaren - gebruik 2020 regels
  return {
    ...baseRules,
    incomeTaxRate1: 37.35,
    incomeTaxRate2: 37.35,
    incomeTaxRate3: 49.50,
    incomeTaxRate4: 49.50,
    incomeTaxBracket1: 68508,
    incomeTaxBracket2: 68508,
    incomeTaxBracket3: 68508,
    generalTaxCredit: 2838,
    employmentTaxCredit: 0,
    selfEmployedDeduction: 5030,
    smeProfitExemption: 14.0,
  };
}

/**
 * Valideert of belastingregels compleet zijn
 */
export function validateTaxRules(rules: Partial<TaxRulesData>): boolean {
  return !!(
    rules.vatStandardRate !== undefined &&
    rules.vatReducedRate !== undefined &&
    rules.vatFilingFrequency
  );
}

