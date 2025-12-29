import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { periodId, status } = body;

    if (!periodId || !status) {
      return NextResponse.json(
        { error: "Period ID en status zijn verplicht" },
        { status: 400 }
      );
    }

    // Valideer status
    const validStatuses = ["open", "ready", "filed", "reopened"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Ongeldige status" },
        { status: 400 }
      );
    }

    // Verifieer dat de periode bij het bedrijf van de gebruiker hoort
    const period = await prisma.vatPeriod.findUnique({
      where: { id: periodId },
      include: {
        company: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!period) {
      return NextResponse.json(
        { error: "BTW periode niet gevonden" },
        { status: 404 }
      );
    }

    if (period.company.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Geen toegang tot deze BTW periode" },
        { status: 403 }
      );
    }

    // Update status
    await prisma.vatPeriod.update({
      where: { id: periodId },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating VAT period status:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij bijwerken status" },
      { status: 500 }
    );
  }
}

