import { prisma } from "@/lib/prisma";
import { getCompanyTaxRules } from "./getCompanyTaxRules";
import { calculateProfitAndLoss } from "../reports/reports";

export interface IncomeTaxCalculationResult {
  // Input gegevens
  profitFromBusiness: number;
  otherIncome: number;
  totalIncome: number;
  
  // Aftrekposten
  selfEmployedDeduction: number;
  smeProfitExemption: number;
  mortgageInterest: number;
  healthcareCosts: number;
  educationCosts: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Belastbaar inkomen
  taxableIncome: number;
  
  // Belasting per schijf
  taxBracket1: {
    amount: number;
    rate: number;
    tax: number;
  };
  taxBracket2: {
    amount: number;
    rate: number;
    tax: number;
  };
  taxBracket3: {
    amount: number;
    rate: number;
    tax: number;
  };
  taxBracket4: {
    amount: number;
    rate: number;
    tax: number;
  };
  
  // Totaal belasting
  totalTaxBeforeCredits: number;
  
  // Kortingen
  generalTaxCredit: number;
  employmentTaxCredit: number;
  totalCredits: number;
  
  // Eindbedrag
  finalTaxAmount: number;
  
  // Metadata
  year: number;
  calculationDate: Date;
}

/**
 * Berekent de inkomstenbelasting voor een bedrijf
 * Gebruikt winst uit W&V rapportage en aanvullende persoonlijke gegevens
 */
export async function calculateIncomeTax(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<IncomeTaxCalculationResult> {
  // Haal belastingregels op
  const taxRules = await getCompanyTaxRules(companyId);
  
  // Haal persoonlijke belastinggegevens op
  const incomeTaxData = await prisma.incomeTaxData.findUnique({
    where: { companyId },
  });
  
  // Haal winst uit onderneming op via W&V rapportage
  const pnl = await calculateProfitAndLoss(companyId, startDate, endDate);
  const profitFromBusiness = pnl.profit.total;
  
  // Andere inkomsten (niet uit onderneming)
  const otherIncome = incomeTaxData?.otherIncome 
    ? Number(incomeTaxData.otherIncome) 
    : 0;
  
  // Totaal inkomen
  const totalIncome = profitFromBusiness + otherIncome;
  
  // Aftrekposten
  const selfEmployedDeduction = taxRules.selfEmployedDeduction 
    ? Number(taxRules.selfEmployedDeduction) 
    : 0;
  
  // MKB-winstvrijstelling (percentage van winst)
  const smeProfitExemptionPercentage = taxRules.smeProfitExemption 
    ? Number(taxRules.smeProfitExemption) 
    : 0;
  const smeProfitExemption = profitFromBusiness > 0 
    ? (profitFromBusiness * smeProfitExemptionPercentage) / 100 
    : 0;
  
  const mortgageInterest = incomeTaxData?.mortgageInterest 
    ? Number(incomeTaxData.mortgageInterest) 
    : 0;
  
  const healthcareCosts = incomeTaxData?.healthcareCosts 
    ? Number(incomeTaxData.healthcareCosts) 
    : 0;
  
  const educationCosts = incomeTaxData?.educationCosts 
    ? Number(incomeTaxData.educationCosts) 
    : 0;
  
  const otherDeductions = incomeTaxData?.otherDeductions 
    ? Number(incomeTaxData.otherDeductions) 
    : 0;
  
  const totalDeductions = 
    selfEmployedDeduction + 
    smeProfitExemption + 
    mortgageInterest + 
    healthcareCosts + 
    educationCosts + 
    otherDeductions;
  
  // Belastbaar inkomen
  const taxableIncome = Math.max(0, totalIncome - totalDeductions);
  
  // Haal belastingschijven op
  const bracket1 = taxRules.incomeTaxBracket1 ? Number(taxRules.incomeTaxBracket1) : 0;
  const bracket2 = taxRules.incomeTaxBracket2 ? Number(taxRules.incomeTaxBracket2) : 0;
  const bracket3 = taxRules.incomeTaxBracket3 ? Number(taxRules.incomeTaxBracket3) : 0;
  
  const rate1 = taxRules.incomeTaxRate1 ? Number(taxRules.incomeTaxRate1) : 0;
  const rate2 = taxRules.incomeTaxRate2 ? Number(taxRules.incomeTaxRate2) : 0;
  const rate3 = taxRules.incomeTaxRate3 ? Number(taxRules.incomeTaxRate3) : 0;
  const rate4 = taxRules.incomeTaxRate4 ? Number(taxRules.incomeTaxRate4) : 0;
  
  // Bereken belasting per schijf
  let remainingIncome = taxableIncome;
  
  // Schijf 1
  const amount1 = Math.min(remainingIncome, bracket1);
  const tax1 = (amount1 * rate1) / 100;
  remainingIncome = Math.max(0, remainingIncome - bracket1);
  
  // Schijf 2
  const amount2 = bracket2 > bracket1 
    ? Math.min(remainingIncome, bracket2 - bracket1) 
    : 0;
  const tax2 = (amount2 * rate2) / 100;
  remainingIncome = Math.max(0, remainingIncome - (bracket2 - bracket1));
  
  // Schijf 3
  const amount3 = bracket3 > bracket2 
    ? Math.min(remainingIncome, bracket3 - bracket2) 
    : 0;
  const tax3 = (amount3 * rate3) / 100;
  remainingIncome = Math.max(0, remainingIncome - (bracket3 - bracket2));
  
  // Schijf 4 (alles boven schijf 3)
  const amount4 = remainingIncome;
  const tax4 = (amount4 * rate4) / 100;
  
  const totalTaxBeforeCredits = tax1 + tax2 + tax3 + tax4;
  
  // Kortingen
  const generalTaxCredit = taxRules.generalTaxCredit 
    ? Number(taxRules.generalTaxCredit) 
    : 0;
  
  const employmentTaxCredit = taxRules.employmentTaxCredit 
    ? Number(taxRules.employmentTaxCredit) 
    : 0;
  
  const totalCredits = generalTaxCredit + employmentTaxCredit;
  
  // Eindbedrag (kan niet negatief zijn)
  const finalTaxAmount = Math.max(0, totalTaxBeforeCredits - totalCredits);
  
  return {
    profitFromBusiness,
    otherIncome,
    totalIncome,
    selfEmployedDeduction,
    smeProfitExemption,
    mortgageInterest,
    healthcareCosts,
    educationCosts,
    otherDeductions,
    totalDeductions,
    taxableIncome,
    taxBracket1: {
      amount: amount1,
      rate: rate1,
      tax: tax1,
    },
    taxBracket2: {
      amount: amount2,
      rate: rate2,
      tax: tax2,
    },
    taxBracket3: {
      amount: amount3,
      rate: rate3,
      tax: tax3,
    },
    taxBracket4: {
      amount: amount4,
      rate: rate4,
      tax: tax4,
    },
    totalTaxBeforeCredits,
    generalTaxCredit,
    employmentTaxCredit,
    totalCredits,
    finalTaxAmount,
    year: taxRules.year,
    calculationDate: new Date(),
  };
}

