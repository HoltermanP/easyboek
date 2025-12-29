import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_BYPASS_MODE } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Sync gebruiker met database
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

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

    // Haal subscription op
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Geen abonnement gevonden" },
        { status: 404 }
      );
    }

    // Voor trial subscriptions: gewoon annuleren
    if (subscription.isTrial || subscription.status === "trialing") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "canceled",
        },
      });

      // Annuleer ook in Stripe als er een Stripe subscription is
      if (subscription.stripeSubscriptionId && !STRIPE_BYPASS_MODE && stripe) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (error) {
          console.error("Error canceling Stripe subscription:", error);
          // Doorgaan ook als Stripe cancel faalt
        }
      }

      return NextResponse.json({ 
        success: true,
        message: "Proefperiode geannuleerd",
      });
    }

    // Voor betaalde subscriptions: check of contract is verlopen
    const now = new Date();
    const contractEndDate = subscription.currentPeriodEnd;

    if (contractEndDate && now < contractEndDate) {
      // Contract is nog niet verlopen - niet opzegbaar
      return NextResponse.json(
        { 
          error: "Je abonnement is niet tussentijds opzegbaar. Het contract loopt tot " + contractEndDate.toLocaleDateString("nl-NL"),
          contractEndDate: contractEndDate.toISOString(),
        },
        { status: 403 }
      );
    }

    // Contract is verlopen - kan worden geannuleerd
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: true,
      },
    });

    // Annuleer in Stripe (aan einde van periode)
    if (subscription.stripeSubscriptionId && !STRIPE_BYPASS_MODE && stripe) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (error) {
        console.error("Error updating Stripe subscription:", error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Abonnement wordt geannuleerd aan het einde van de periode",
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij annuleren abonnement" },
      { status: 500 }
    );
  }
}

