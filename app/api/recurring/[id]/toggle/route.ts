import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    // Check of de herhalende boeking bestaat en bij de gebruiker hoort
    const recurring = await prisma.recurringBooking.findFirst({
      where: {
        id,
        company: {
          owner: {
            clerkId: user.clerkId,
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

    // Toggle isActive
    const updated = await prisma.recurringBooking.update({
      where: { id },
      data: { isActive: !recurring.isActive },
    });

    return NextResponse.json({ success: true, recurring: updated });
  } catch (error) {
    console.error("Error toggling recurring booking:", error);
    return NextResponse.json(
      { error: "Fout bij het bijwerken van herhalende boeking" },
      { status: 500 }
    );
  }
}

