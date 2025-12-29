import { prisma } from "@/lib/prisma";
import { calculateVatOverview } from "../btw/btw";
import { calculateIncomeTax } from "./calculateIncomeTax";
import { calculateProfitAndLoss } from "../reports/reports";

export interface ReservationAdvice {
  // BTW reservering
  vatReservation: {
    totalVatOwed: number; // Totaal BTW verschuldigd
    recommendedReservation: number; // Aanbevolen reservering
    percentage: number; // Percentage van omzet dat gereserveerd moet worden
  };
  
  // Inkomstenbelasting reservering
  incomeTaxReservation: {
    estimatedTax: number; // Geschatte inkomstenbelasting
    recommendedReservation: number; // Aanbevolen reservering
    percentage: number; // Percentage van winst dat gereserveerd moet worden
  };
  
  // Totaal reservering
  totalReservation: number;
  
  // Metadata
  calculationDate: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Berekent reserveringsadvies voor BTW en Inkomstenbelasting
 * Gebaseerd op betaalde facturen en winst
 */
export async function calculateReservationAdvice(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<ReservationAdvice> {
  const now = new Date();
  
  // Haal alle betaalde facturen op in de periode
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: "paid",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  // Bereken totaal betaalde omzet (excl. BTW) en BTW
  let totalPaidRevenue = 0;
  let totalPaidVat = 0;
  
  for (const invoice of paidInvoices) {
    const invoiceTotal = Number(invoice.total);
    const invoiceVat = Number(invoice.vatTotal);
    const invoiceExclVat = invoiceTotal - invoiceVat;
    
    totalPaidRevenue += invoiceExclVat;
    totalPaidVat += invoiceVat;
  }
  
  // Bereken BTW verschuldigd voor de periode
  const vatOverview = await calculateVatOverview(companyId, startDate, endDate);
  const vatOwed = vatOverview.teBetalen;
  
  // BTW reservering: reserveer het BTW bedrag dat verschuldigd is
  // Voor ZZP'ers is het veilig om 100% van de BTW te reserveren
  const vatReservationPercentage = 100; // 100% van BTW verschuldigd
  const recommendedVatReservation = Math.max(0, vatOwed);
  
  // Bereken winst voor inkomstenbelasting
  const pnl = await calculateProfitAndLoss(companyId, startDate, endDate);
  const profit = pnl.profit.total;
  
  // Bereken geschatte inkomstenbelasting
  let estimatedIncomeTax = 0;
  let incomeTaxReservationPercentage = 0;
  
  if (profit > 0) {
    try {
      const incomeTaxCalculation = await calculateIncomeTax(companyId, startDate, endDate);
      estimatedIncomeTax = incomeTaxCalculation.finalTaxAmount;
      
      // Voor ZZP'ers is het veilig om 40-50% van de winst te reserveren voor belastingen
      // Dit is een conservatieve schatting
      incomeTaxReservationPercentage = estimatedIncomeTax > 0 
        ? (estimatedIncomeTax / profit) * 100 
        : 40; // Standaard 40% als we geen berekening kunnen maken
      
      // Beperk tot redelijke percentages (30-50%)
      incomeTaxReservationPercentage = Math.max(30, Math.min(50, incomeTaxReservationPercentage));
    } catch (error) {
      console.error("Error calculating income tax:", error);
      // Fallback: gebruik 40% van winst als conservatieve schatting
      incomeTaxReservationPercentage = 40;
      estimatedIncomeTax = profit * 0.4;
    }
  }
  
  const recommendedIncomeTaxReservation = Math.max(0, estimatedIncomeTax);
  
  // Totaal reservering
  const totalReservation = recommendedVatReservation + recommendedIncomeTaxReservation;
  
  return {
    vatReservation: {
      totalVatOwed: vatOwed,
      recommendedReservation: recommendedVatReservation,
      percentage: vatReservationPercentage,
    },
    incomeTaxReservation: {
      estimatedTax: estimatedIncomeTax,
      recommendedReservation: recommendedIncomeTaxReservation,
      percentage: incomeTaxReservationPercentage,
    },
    totalReservation,
    calculationDate: now,
    period: {
      startDate,
      endDate,
    },
  };
}

/**
 * Berekent reserveringsadvies voor het huidige jaar
 */
export async function calculateYearlyReservationAdvice(
  companyId: string,
  year: number = new Date().getFullYear()
): Promise<ReservationAdvice> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  
  return calculateReservationAdvice(companyId, startDate, endDate);
}

/**
 * Berekent reserveringsadvies voor de lopende maand
 */
export async function calculateMonthlyReservationAdvice(
  companyId: string
): Promise<ReservationAdvice> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return calculateReservationAdvice(companyId, startDate, endDate);
}

/**
 * Uitgebreid reserveringsadvies met progressie informatie
 */
export interface QuarterlyReservationAdvice extends ReservationAdvice {
  // Progressie informatie
  progress: {
    daysElapsed: number; // Aantal dagen verstreken in kwartaal
    daysTotal: number; // Totaal aantal dagen in kwartaal
    percentageElapsed: number; // Percentage van kwartaal verstreken
    shouldHaveReservedByNow: number; // Hoeveel er al gereserveerd had moeten zijn
  };
}

/**
 * Berekent kwartaalgebaseerd reserveringsadvies met progressie
 * Toont hoeveel er gereserveerd moet worden en hoeveel er al gereserveerd had moeten zijn
 */
export async function calculateQuarterlyReservationAdvice(
  companyId: string
): Promise<QuarterlyReservationAdvice | null> {
  const now = new Date();
  
  // Bepaal huidig kwartaal
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
  startOfQuarter.setHours(0, 0, 0, 0);
  const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
  
  // Bereken progressie
  const daysElapsed = Math.floor((now.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysTotal = Math.floor((endOfQuarter.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const percentageElapsed = Math.min(100, Math.max(0, (daysElapsed / daysTotal) * 100));
  
  // Bereken reserveringsadvies voor het hele kwartaal
  const advice = await calculateReservationAdvice(companyId, startOfQuarter, endOfQuarter);
  
  // Bereken hoeveel er al gereserveerd had moeten zijn op basis van progressie
  // We gebruiken een lineaire progressie voor BTW reservering
  const shouldHaveReservedByNow = advice.vatReservation.recommendedReservation * (percentageElapsed / 100);
  
  return {
    ...advice,
    progress: {
      daysElapsed,
      daysTotal,
      percentageElapsed,
      shouldHaveReservedByNow,
    },
  };
}

