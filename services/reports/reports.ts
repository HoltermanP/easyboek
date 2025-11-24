import { prisma } from "@/lib/prisma";

/**
 * Berekent Winst & Verlies overzicht voor een periode
 */
export async function calculateProfitAndLoss(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  // Haal alle boekingen op in de periode
  const bookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
  });

  // Groepeer opbrengsten (credit op 8xxx rekeningen)
  const revenueBookings = bookings.filter(
    (b) => b.creditAccount.code.startsWith("8")
  );
  const totalRevenue = revenueBookings.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );

  // Groepeer kosten per categorie (debet op 4xxx rekeningen)
  const costBookings = bookings.filter((b) =>
    b.debitAccount.code.startsWith("4")
  );

  // Groepeer kosten per rekening
  const costsByAccount = costBookings.reduce(
    (acc, b) => {
      const code = b.debitAccount.code;
      if (!acc[code]) {
        acc[code] = {
          code,
          name: b.debitAccount.name,
          amount: 0,
        };
      }
      acc[code].amount += Number(b.amount);
      return acc;
    },
    {} as Record<string, { code: string; name: string; amount: number }>
  );

  const totalCosts = Object.values(costsByAccount).reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    period: { startDate, endDate },
    revenue: {
      total: totalRevenue,
      bookings: revenueBookings.length,
      breakdown: revenueBookings.reduce(
        (acc, b) => {
          const code = b.creditAccount.code;
          if (!acc[code]) {
            acc[code] = {
              code,
              name: b.creditAccount.name,
              amount: 0,
            };
          }
          acc[code].amount += Number(b.amount);
          return acc;
        },
        {} as Record<string, { code: string; name: string; amount: number }>
      ),
    },
    costs: {
      total: totalCosts,
      bookings: costBookings.length,
      breakdown: Object.values(costsByAccount).sort((a, b) => b.amount - a.amount),
    },
    profit: {
      total: profit,
      margin: profitMargin,
    },
  };
}

/**
 * Berekent Balans overzicht op een bepaald moment
 */
export async function calculateBalanceSheet(companyId: string, date: Date) {
  // Haal alle boekingen op tot en met de datum
  const bookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        lte: date,
      },
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
  });

  // Bereken saldi per rekening
  const accountBalances: Record<
    string,
    { code: string; name: string; debit: number; credit: number; balance: number }
  > = {};

  for (const booking of bookings) {
    // Debet boeking
    if (!accountBalances[booking.debitAccountId]) {
      accountBalances[booking.debitAccountId] = {
        code: booking.debitAccount.code,
        name: booking.debitAccount.name,
        debit: 0,
        credit: 0,
        balance: 0,
      };
    }
    accountBalances[booking.debitAccountId].debit += Number(booking.amount);

    // Credit boeking
    if (!accountBalances[booking.creditAccountId]) {
      accountBalances[booking.creditAccountId] = {
        code: booking.creditAccount.code,
        name: booking.creditAccount.name,
        debit: 0,
        credit: 0,
        balance: 0,
      };
    }
    accountBalances[booking.creditAccountId].credit += Number(booking.amount);
  }

  // Bereken saldi
  for (const accountId in accountBalances) {
    const acc = accountBalances[accountId];
    // Activa en kosten: debet - credit
    // Passiva en opbrengsten: credit - debet
    if (acc.code.startsWith("1") || acc.code.startsWith("4")) {
      acc.balance = acc.debit - acc.credit;
    } else {
      acc.balance = acc.credit - acc.debit;
    }
  }

  // Groepeer per categorie
  const activa = Object.values(accountBalances).filter(
    (acc) => acc.code.startsWith("1") && acc.balance !== 0
  );
  const passiva = Object.values(accountBalances).filter(
    (acc) => (acc.code.startsWith("2") || acc.code.startsWith("3")) && acc.balance !== 0
  );

  const totalActiva = activa.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPassiva = passiva.reduce((sum, acc) => sum + acc.balance, 0);

  // Eigen vermogen = activa - passiva (of uit boekingen)
  const eigenVermogen = accountBalances["2000"]?.balance || 0;
  const totaalPassivaInclEigenVermogen = totalPassiva + eigenVermogen;

  return {
    date,
    activa: {
      items: activa.sort((a, b) => parseInt(a.code) - parseInt(b.code)),
      total: totalActiva,
    },
    passiva: {
      items: passiva.sort((a, b) => parseInt(a.code) - parseInt(b.code)),
      total: totalPassiva,
    },
    eigenVermogen: {
      amount: eigenVermogen,
    },
    total: {
      activa: totalActiva,
      passiva: totaalPassivaInclEigenVermogen,
      balanced: Math.abs(totalActiva - totaalPassivaInclEigenVermogen) < 0.01,
    },
  };
}

/**
 * Berekent Cashflow overzicht voor een periode
 */
export async function calculateCashFlow(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  // Haal alle boekingen op in de periode
  const bookings = await prisma.booking.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
  });

  // Cashflow uit operationele activiteiten
  // Inkomsten (credit op bank/kas)
  const cashInflows = bookings.filter(
    (b) =>
      (b.creditAccount.code === "1000" || b.creditAccount.code === "1010") &&
      b.debitAccount.code.startsWith("8")
  );
  const totalCashIn = cashInflows.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );

  // Uitgaven (debet op bank/kas)
  const cashOutflows = bookings.filter(
    (b) =>
      (b.debitAccount.code === "1000" || b.debitAccount.code === "1010") &&
      b.creditAccount.code.startsWith("4")
  );
  const totalCashOut = cashOutflows.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );

  const netCashFlow = totalCashIn - totalCashOut;

  return {
    period: { startDate, endDate },
    operating: {
      cashIn: totalCashIn,
      cashOut: totalCashOut,
      netFlow: netCashFlow,
    },
    breakdown: {
      inflows: cashInflows.map((b) => ({
        date: b.date,
        description: b.description,
        amount: Number(b.amount),
        account: b.debitAccount.name,
      })),
      outflows: cashOutflows.map((b) => ({
        date: b.date,
        description: b.description,
        amount: Number(b.amount),
        account: b.creditAccount.name,
      })),
    },
  };
}

/**
 * Berekent trends voor omzet en kosten over meerdere perioden
 */
export async function calculateTrends(
  companyId: string,
  periods: number = 12 // Aantal maanden
) {
  const now = new Date();
  const trends = [];

  for (let i = periods - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    const pnl = await calculateProfitAndLoss(companyId, startDate, endDate);

    trends.push({
      period: month.toISOString().slice(0, 7), // YYYY-MM
      month: month.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
      revenue: pnl.revenue.total,
      costs: pnl.costs.total,
      profit: pnl.profit.total,
    });
  }

  return trends;
}

