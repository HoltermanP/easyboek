import Stripe from "stripe";

// Check of Stripe moet worden gebypassed
export const STRIPE_BYPASS_MODE = process.env.STRIPE_BYPASS_MODE === "true";

// Maak Stripe optioneel - alleen initialiseren als key is ingesteld EN niet in bypass mode
export const stripe = !STRIPE_BYPASS_MODE && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Helper functie om te checken of Stripe beschikbaar is
export function isStripeEnabled(): boolean {
  return !STRIPE_BYPASS_MODE && stripe !== null;
}

// Helper functie om te checken of we in test mode zijn
export function isStripeTestMode(): boolean {
  if (STRIPE_BYPASS_MODE) return true;
  if (!stripe) return false;
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}

// Plan configuratie
// Abonnementen worden maandelijks betaald maar zijn jaarlijks contractueel (niet tussentijds opzegbaar)
// Premium heeft een proefmaand beschikbaar
export const PLANS = {
  basis: {
    name: "Basis",
    priceId: process.env.STRIPE_PRICE_ID_BASIS || "", // Moet worden ingesteld in .env
    amount: 29.95, // Maandelijks
    currency: "eur",
    interval: "month", // Maandelijkse betalingen
    contractPeriodMonths: 12, // Jaarlijks contract (12 maanden)
    hasTrial: false, // Geen proefperiode voor Basis
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM || "", // Moet worden ingesteld in .env
    amount: 39.95, // Maandelijks
    currency: "eur",
    interval: "month", // Maandelijkse betalingen
    contractPeriodMonths: 12, // Jaarlijks contract (12 maanden)
    hasTrial: true, // 1 maand gratis proefperiode
    trialPeriodDays: 30, // 30 dagen proefperiode
  },
} as const;

export type PlanType = keyof typeof PLANS;

