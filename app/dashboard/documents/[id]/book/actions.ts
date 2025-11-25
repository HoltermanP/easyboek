"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBookingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const documentId = formData.get("documentId") as string;
  const companyId = formData.get("companyId") as string;
  const debitAccountId = formData.get("debitAccountId") as string;
  const bankAccountId = formData.get("bankAccountId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const date = new Date(formData.get("date") as string);

  if (!documentId || !companyId || !debitAccountId || !bankAccountId || !amount || !description) {
    throw new Error("Alle velden zijn verplicht");
  }

  try {
    // Verify document belongs to user's company
    const document = await prisma.transactionDocument.findFirst({
      where: {
        id: documentId,
        companyId: companyId,
      },
    });

    if (!document) {
      throw new Error("Document niet gevonden");
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        companyId: companyId,
        date: date,
        description: description,
        debitAccountId: debitAccountId,
        creditAccountId: bankAccountId,
        amount: amount,
        vatCode: null,
        createdBy: user.id,
      },
    });

    // Update document status
    await prisma.transactionDocument.update({
      where: { id: documentId },
      data: {
        status: "booked",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/bookings");

    redirect("/dashboard/bookings");
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error instanceof Error ? error : new Error("Fout bij aanmaken boeking");
  }
}



