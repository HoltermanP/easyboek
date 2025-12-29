"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { bookMileageEntries } from "@/services/mileage/bookMileageEntries";

export async function createMileageEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const companyId = formData.get("companyId") as string;
  const date = formData.get("date") as string;
  const kilometers = formData.get("kilometers") as string;
  const fromLocation = formData.get("fromLocation") as string | null;
  const toLocation = formData.get("toLocation") as string | null;
  const purpose = formData.get("purpose") as string | null;
  const ratePerKm = formData.get("ratePerKm") as string | null;

  if (!companyId || !date || !kilometers) {
    return { error: "Datum en aantal kilometers zijn verplicht" };
  }

  const kilometersDecimal = parseFloat(kilometers);
  if (isNaN(kilometersDecimal) || kilometersDecimal <= 0) {
    return { error: "Aantal kilometers moet een positief getal zijn" };
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

  // Standaard kilometervergoeding is 21 cent per km (2025 tarief)
  const defaultRatePerKm = 0.21;
  const rate = ratePerKm ? parseFloat(ratePerKm) : defaultRatePerKm;
  const totalAmount = kilometersDecimal * rate;

  try {
    await prisma.mileageEntry.create({
      data: {
        companyId: company.id,
        date: new Date(date),
        kilometers: new Decimal(kilometersDecimal),
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
        purpose: purpose || null,
        ratePerKm: new Decimal(rate),
        totalAmount: new Decimal(totalAmount),
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/mileage");
    
    return { success: true };
  } catch (error) {
    console.error("Error creating mileage entry:", error);
    return { error: "Fout bij aanmaken kilometerregistratie" };
  }
}

export async function deleteMileageEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const entryId = formData.get("entryId") as string;
  const companyId = formData.get("companyId") as string;

  if (!entryId || !companyId) {
    return { error: "Entry ID en bedrijf ID zijn verplicht" };
  }

  // Verify user owns the company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    return { error: "Bedrijf niet gevonden" };
  }

  // Verify entry belongs to company
  const entry = await prisma.mileageEntry.findFirst({
    where: {
      id: entryId,
      companyId: companyId,
    },
  });

  if (!entry) {
    return { error: "Kilometerregistratie niet gevonden" };
  }

  // Don't allow deletion if already booked
  if (entry.isBooked) {
    return { error: "Kan niet verwijderen: deze registratie is al geboekt" };
  }

  try {
    await prisma.mileageEntry.delete({
      where: {
        id: entryId,
      },
    });

    revalidatePath("/dashboard/mileage");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting mileage entry:", error);
    return { error: "Fout bij verwijderen kilometerregistratie" };
  }
}

export async function bookAllMileageEntries(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const companyId = formData.get("companyId") as string;

  if (!companyId) {
    return { error: "Bedrijf ID is verplicht" };
  }

  // Verify user owns the company
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    return { error: "Bedrijf niet gevonden" };
  }

  try {
    const result = await bookMileageEntries(companyId, user.id);

    if (result.errors.length > 0) {
      return {
        success: true,
        warning: `${result.count} registraties geboekt, ${result.errors.length} fouten`,
        booked: result.count,
        errors: result.errors.length,
      };
    }

    revalidatePath("/dashboard/mileage");
    revalidatePath("/dashboard/bookings");
    
    return {
      success: true,
      booked: result.count,
      message: `${result.count} kilometerregistratie${result.count !== 1 ? "s" : ""} geboekt`,
    };
  } catch (error) {
    console.error("Error booking mileage entries:", error);
    return {
      error: error instanceof Error ? error.message : "Fout bij boeken kilometerregistraties",
    };
  }
}

