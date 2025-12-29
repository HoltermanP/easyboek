import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check of gebruiker al bestaat
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Sync gebruiker met database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || null,
        role: "user",
        isDeveloper: clerkUser.emailAddresses[0]?.emailAddress?.endsWith("@easyboek.nl") || false,
      },
    });

    // Check of er al een subscription bestaat
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Je hebt al een abonnement" },
        { status: 400 }
      );
    }

    // Proefmaand is alleen beschikbaar voor Premium
    // Maak proefabonnement aan (1 maand gratis Premium)
    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 1); // 1 maand vanaf nu

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "premium", // Premium plan met trial
        status: "trialing",
        isTrial: true,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
      },
    });

    return NextResponse.json({ 
      success: true,
      subscription,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error starting trial:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij starten proefperiode" },
      { status: 500 }
    );
  }
}

