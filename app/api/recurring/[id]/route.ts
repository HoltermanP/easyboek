import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const { id } = params;

    // Check of de herhalende boeking bestaat en bij de gebruiker hoort
    const recurring = await prisma.recurringBooking.findFirst({
      where: {
        id,
        company: {
          owner: {
            id: user!.id,
          },
        },
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: "Herhalende boeking niet gevonden" },
        { status: 404 }
      );
    }

    // Verwijder de herhalende boeking
    await prisma.recurringBooking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring booking:", error);
    return NextResponse.json(
      { error: "Fout bij het verwijderen van herhalende boeking" },
      { status: 500 }
    );
  }
}

