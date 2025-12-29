import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, STRIPE_BYPASS_MODE } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Skip webhook processing in bypass mode
  if (STRIPE_BYPASS_MODE) {
    console.log("Webhook bypassed - STRIPE_BYPASS_MODE is enabled");
    return NextResponse.json({ received: true, bypassed: true });
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is niet geconfigureerd" },
      { status: 503 }
    );
  }
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe!.webhooks.constructEvent(body, signature, webhookSecret as string);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error("Missing userId or plan in checkout session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  // Haal subscription op van Stripe
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  // Voor jaarlijkse contracten met maandelijkse betalingen: bereken contract einddatum (12 maanden vanaf start)
  const subscriptionStart = new Date((subscription as any).current_period_start * 1000);
  const contractEndDate = new Date(subscriptionStart);
  contractEndDate.setMonth(contractEndDate.getMonth() + 12); // 12 maanden contract

  // Check of dit een trial is
  const isTrial = subscription.status === "trialing";
  const trialEndsAt = isTrial && (subscription as any).trial_end 
    ? new Date((subscription as any).trial_end * 1000)
    : null;

  // Update of maak subscription aan
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId || undefined,
      plan: plan as string,
      status: subscription.status,
      isTrial,
      trialEndsAt,
      currentPeriodStart: subscriptionStart,
      currentPeriodEnd: contractEndDate, // Einde van het jaarlijkse contract (12 maanden)
      cancelAtPeriodEnd: false, // Niet opzegbaar tussentijds
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId || undefined,
      plan: plan as string,
      status: subscription.status,
      isTrial,
      trialEndsAt,
      currentPeriodStart: subscriptionStart,
      currentPeriodEnd: contractEndDate, // Einde van het jaarlijkse contract (12 maanden)
      cancelAtPeriodEnd: false, // Niet opzegbaar tussentijds
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error("Subscription not found in database");
    return;
  }

  // Jaarlijkse contracten met maandelijkse betalingen: behoud contract einddatum
  // Als de subscription wordt geannuleerd in Stripe, herstel deze (niet opzegbaar tussentijds)
  const subscriptionStart = new Date((subscription as any).current_period_start * 1000);
  const contractEndDate = new Date(subscriptionStart);
  contractEndDate.setMonth(contractEndDate.getMonth() + 12); // 12 maanden contract

  // Als subscription wordt geannuleerd maar contract nog niet verlopen, herstel status
  let finalStatus = subscription.status;
  if (subscription.status === "canceled" && new Date() < contractEndDate) {
    finalStatus = "active"; // Herstel actieve status als contract nog loopt
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: finalStatus,
      currentPeriodStart: subscriptionStart,
      currentPeriodEnd: contractEndDate, // Behoud contract einddatum
      cancelAtPeriodEnd: false, // Jaarlijkse contracten zijn niet opzegbaar
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "canceled",
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "active",
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: "past_due",
      },
    });
  }
}

