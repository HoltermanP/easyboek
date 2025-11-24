import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      companyId,
      description,
      debitAccountId,
      creditAccountId,
      amount,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
      vatCode,
      createdBy,
    } = body;

    // Valideer input
    if (
      !companyId ||
      !description ||
      !debitAccountId ||
      !creditAccountId ||
      !amount ||
      !frequency ||
      !dayOfMonth ||
      !startDate ||
      !createdBy
    ) {
      return NextResponse.json(
        { error: "Alle verplichte velden moeten worden ingevuld" },
        { status: 400 }
      );
    }

    // Check of company bij gebruiker hoort
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        owner: {
          clerkId: user.clerkId,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Bedrijf niet gevonden" },
        { status: 404 }
      );
    }

    // Valideer dat rekeningen bestaan
    const [debitAccount, creditAccount] = await Promise.all([
      prisma.ledgerAccount.findFirst({
        where: {
          id: debitAccountId,
          companyId,
        },
      }),
      prisma.ledgerAccount.findFirst({
        where: {
          id: creditAccountId,
          companyId,
        },
      }),
    ]);

    if (!debitAccount || !creditAccount) {
      return NextResponse.json(
        { error: "Een of beide rekeningen niet gevonden" },
        { status: 404 }
      );
    }

    // Valideer frequentie
    if (!["monthly", "quarterly", "yearly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Ongeldige frequentie" },
        { status: 400 }
      );
    }

    // Valideer dag van maand
    if (dayOfMonth < 1 || dayOfMonth > 31) {
      return NextResponse.json(
        { error: "Dag van maand moet tussen 1 en 31 zijn" },
        { status: 400 }
      );
    }

    // Maak herhalende boeking aan
    const recurringBooking = await prisma.recurringBooking.create({
      data: {
        companyId,
        description,
        debitAccountId,
        creditAccountId,
        amount,
        frequency,
        dayOfMonth,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        vatCode: vatCode || null,
        createdBy,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/recurring");

    return NextResponse.json({
      success: true,
      recurringBooking,
    });
  } catch (error) {
    console.error("Error creating recurring booking:", error);
    return NextResponse.json(
      { error: "Fout bij aanmaken herhalende boeking" },
      { status: 500 }
    );
  }
}

