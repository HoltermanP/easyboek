import { prisma } from "@/lib/prisma";
import { createBooking } from "@/services/bookings/createBooking";

/**
 * Boekt alle niet-geboekte kilometerregistraties voor een bedrijf
 * Maakt boekingen aan: Reiskosten (4600) debet, Bank (1000) credit
 */
export async function bookMileageEntries(companyId: string, userId: string) {
  // Haal alle niet-geboekte kilometerregistraties op
  const entries = await prisma.mileageEntry.findMany({
    where: {
      companyId,
      isBooked: false,
    },
    orderBy: {
      date: "asc",
    },
  });

  if (entries.length === 0) {
    return {
      booked: [],
      errors: [],
      count: 0,
    };
  }

  // Zoek of maak Reiskosten rekening (4600)
  let travelAccount = await prisma.ledgerAccount.findFirst({
    where: {
      companyId,
      code: "4600",
    },
  });

  if (!travelAccount) {
    // Maak de rekening aan als deze niet bestaat
    travelAccount = await prisma.ledgerAccount.create({
      data: {
        companyId,
        code: "4600",
        name: "Reiskosten",
        type: "result",
      },
    });
  }

  // Zoek bankrekening (1000) of kas (1010)
  let bankAccount = await prisma.ledgerAccount.findFirst({
    where: {
      companyId,
      code: "1000",
    },
  });

  if (!bankAccount) {
    // Probeer kas rekening
    bankAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId,
        code: "1010",
      },
    });
  }

  if (!bankAccount) {
    throw new Error("Geen bankrekening (1000) of kasrekening (1010) gevonden");
  }

  const booked = [];
  const errors = [];

  for (const entry of entries) {
    try {
      const amount = Number(entry.totalAmount || 0);
      
      if (amount <= 0) {
        errors.push({
          entryId: entry.id,
          error: "Bedrag is 0 of negatief",
        });
        continue;
      }

      // Maak beschrijving
      const descriptionParts = [];
      descriptionParts.push(`Kilometerregistratie: ${Number(entry.kilometers).toFixed(1)} km`);
      
      if (entry.fromLocation || entry.toLocation) {
        const route = [entry.fromLocation || "?", entry.toLocation || "?"].join(" → ");
        descriptionParts.push(`(${route})`);
      }
      
      if (entry.purpose) {
        descriptionParts.push(`- ${entry.purpose}`);
      }

      const description = descriptionParts.join(" ");

      // Maak de boeking aan
      const booking = await createBooking({
        companyId: entry.companyId,
        date: new Date(entry.date),
        description,
        debitAccountId: travelAccount.id, // Reiskosten debet
        creditAccountId: bankAccount.id, // Bank credit
        amount,
        createdBy: userId,
      });

      // Markeer entry als geboekt
      await prisma.mileageEntry.update({
        where: { id: entry.id },
        data: {
          isBooked: true,
          bookingId: booking.id,
        },
      });

      booked.push({
        entryId: entry.id,
        bookingId: booking.id,
        description,
        amount,
      });
    } catch (error) {
      errors.push({
        entryId: entry.id,
        error: error instanceof Error ? error.message : "Onbekende fout",
      });
    }
  }

  return {
    booked,
    errors,
    count: booked.length,
  };
}

/**
 * Haalt alle kilometerregistraties op voor een bedrijf
 */
export async function getMileageEntries(companyId: string) {
  return await prisma.mileageEntry.findMany({
    where: {
      companyId,
    },
    orderBy: {
      date: "desc",
    },
  });
}








