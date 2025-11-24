import { prisma } from "@/lib/prisma";
import { createBooking } from "@/services/bookings/createBooking";

/**
 * Verwerkt alle herhalende boekingen die vandaag moeten worden aangemaakt
 */
export async function processRecurringBookings(companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfMonth = today.getDate();

  // Haal alle actieve herhalende boekingen op
  const recurringBookings = await prisma.recurringBooking.findMany({
    where: {
      companyId,
      isActive: true,
      startDate: {
        lte: today,
      },
      OR: [
        { endDate: null },
        { endDate: { gte: today } },
      ],
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
  });

  const processed = [];
  const errors = [];

  for (const recurring of recurringBookings) {
    try {
      // Check of deze al is verwerkt voor deze maand
      if (recurring.lastProcessed) {
        const lastProcessed = new Date(recurring.lastProcessed);
        lastProcessed.setHours(0, 0, 0, 0);
        
        // Als laatste verwerking in dezelfde maand, skip
        if (
          lastProcessed.getFullYear() === today.getFullYear() &&
          lastProcessed.getMonth() === today.getMonth()
        ) {
          continue;
        }
      }

      // Bepaal of deze vandaag moet worden verwerkt
      let shouldProcess = false;

      if (recurring.frequency === "monthly") {
        // Maandelijks: check of dag van maand overeenkomt
        shouldProcess = dayOfMonth === recurring.dayOfMonth;
      } else if (recurring.frequency === "quarterly") {
        // Per kwartaal: eerste dag van kwartaal (jan, apr, jul, okt)
        const month = today.getMonth(); // 0-11
        shouldProcess =
          dayOfMonth === recurring.dayOfMonth &&
          (month === 0 || month === 3 || month === 6 || month === 9);
      } else if (recurring.frequency === "yearly") {
        // Jaarlijks: check of het de juiste maand en dag is
        const startDate = new Date(recurring.startDate);
        shouldProcess =
          dayOfMonth === recurring.dayOfMonth &&
          today.getMonth() === startDate.getMonth();
      }

      if (!shouldProcess) {
        continue;
      }

      // Maak de boeking aan
      const booking = await createBooking({
        companyId: recurring.companyId,
        date: today,
        description: recurring.description,
        debitAccountId: recurring.debitAccountId,
        creditAccountId: recurring.creditAccountId,
        amount: Number(recurring.amount),
        vatCode: recurring.vatCode || undefined,
        createdBy: recurring.createdBy,
      });

      // Update lastProcessed
      await prisma.recurringBooking.update({
        where: { id: recurring.id },
        data: { lastProcessed: today },
      });

      processed.push({
        recurringId: recurring.id,
        bookingId: booking.id,
        description: recurring.description,
      });
    } catch (error) {
      errors.push({
        recurringId: recurring.id,
        description: recurring.description,
        error: error instanceof Error ? error.message : "Onbekende fout",
      });
    }
  }

  return {
    processed,
    errors,
    count: processed.length,
  };
}

/**
 * Haalt alle herhalende boekingen op voor een bedrijf
 */
export async function getRecurringBookings(companyId: string) {
  return await prisma.recurringBooking.findMany({
    where: {
      companyId,
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

