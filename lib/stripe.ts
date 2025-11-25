import Stripe from "stripe";

// Maak Stripe optioneel - alleen initialiseren als key is ingesteld
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Plan configuratie
export const PLANS = {
  basis: {
    name: "Basis",
    priceId: process.env.STRIPE_PRICE_ID_BASIS || "", // Moet worden ingesteld in .env
    amount: 29.95,
    currency: "eur",
    interval: "month",
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM || "", // Moet worden ingesteld in .env
    amount: 39.95, // Eerste 6 maanden, daarna 49.95
    currency: "eur",
    interval: "month",
  },
} as const;

export type PlanType = keyof typeof PLANS;

