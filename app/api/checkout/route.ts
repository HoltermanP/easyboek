import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanType } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json(
        { error: "Ongeldig abonnement" },
        { status: 400 }
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
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Maak checkout session
    const session = await stripe.checkout.sessions.create({
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
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij aanmaken checkout" },
      { status: 500 }
    );
  }
}

