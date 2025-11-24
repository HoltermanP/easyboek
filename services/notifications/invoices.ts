import { prisma } from "@/lib/prisma";

/**
 * Haalt alle vervallen facturen op die nog niet betaald zijn
 */
export async function getOverdueInvoices(companyId: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: {
        in: ["sent", "draft"], // Concept of verzonden, maar niet betaald
      },
      dueDate: {
        lt: now, // Vervaldatum is in het verleden
      },
    },
    include: {
      customer: true,
    },
    orderBy: {
      dueDate: "asc", // Oudste eerst
    },
  });

  return overdueInvoices;
}

/**
 * Haalt facturen op die binnenkort vervallen (binnen X dagen)
 */
export async function getUpcomingDueInvoices(
  companyId: string,
  daysAhead: number = 7
) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const upcomingInvoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: {
        in: ["sent", "draft"],
      },
      dueDate: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      customer: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return upcomingInvoices;
}

/**
 * Berekent totaal openstaand bedrag aan facturen
 */
export async function getTotalOutstanding(companyId: string) {
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: {
        in: ["sent", "draft"],
      },
    },
  });

  const total = unpaidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  return {
    total,
    count: unpaidInvoices.length,
  };
}

