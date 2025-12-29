import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanType, STRIPE_BYPASS_MODE, isStripeEnabled } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createTestSubscription } from "@/lib/subscription";

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

    const body = await request.json();
    const { plan } = body;

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json(
        { error: "Ongeldig abonnement" },
        { status: 400 }
      );
    }

    // BYPASS MODE: Maak direct een test subscription aan
    if (STRIPE_BYPASS_MODE) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Bypass mode is niet toegestaan in productie" },
          { status: 403 }
        );
      }

      await createTestSubscription(user.id, plan as "basis" | "premium");
      
      return NextResponse.json({ 
        sessionId: "bypass_" + Date.now(),
        url: `${request.nextUrl.origin}/dashboard?bypass=true`,
        bypass: true,
      });
    }

    // NORMALE STRIPE FLOW
    if (!isStripeEnabled()) {
      return NextResponse.json(
        { 
          error: "Stripe is niet geconfigureerd. Gebruik STRIPE_BYPASS_MODE=true voor testen of configureer Stripe keys.",
          bypassAvailable: process.env.NODE_ENV !== "production"
        },
        { status: 503 }
      );
    }

    const planConfig = PLANS[plan as PlanType];
    
    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Stripe price ID niet geconfigureerd voor dit abonnement" },
        { status: 500 }
      );
    }

    // Gebruik email van gebruiker
    const customerEmail = user.email || undefined;

    // Maak of haal Stripe customer op
    let stripeCustomerId: string;
    
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      // Maak nieuwe Stripe customer
      const customer = await stripe!.customers.create({
        email: customerEmail,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Check of gebruiker al een trial heeft gehad (voor premium)
    const hasExistingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    // Voor premium: voeg trial period toe als gebruiker nog geen subscription heeft gehad
    const subscriptionData: any = {
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/sign-up?plan=${plan}&canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    };

    // Voeg trial period toe voor premium (alleen als gebruiker nog geen subscription heeft)
    if (plan === "premium" && planConfig.hasTrial && !hasExistingSubscription) {
      subscriptionData.subscription_data = {
        trial_period_days: planConfig.trialPeriodDays || 30,
      };
    }

    // Maak checkout session
    const session = await stripe!.checkout.sessions.create(subscriptionData);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij aanmaken checkout" },
      { status: 500 }
    );
  }
}

