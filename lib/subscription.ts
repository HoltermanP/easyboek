import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

/**
 * Check of gebruiker een actief abonnement heeft
 * UITGESCHAKELD: Gratis accounts zijn nu toegestaan voor testen
 */
export async function hasActiveSubscription(userId?: string) {
  // Subscription checks zijn uitgeschakeld - alle accounts hebben toegang
  return true;
}

/**
 * Haal subscription op voor gebruiker
 */
export async function getUserSubscription(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }

  return await prisma.subscription.findUnique({
    where: { userId },
  });
}

/**
 * Maak een test subscription aan (alleen voor development)
 */
export async function createTestSubscription(userId: string, plan: "basis" | "premium" = "premium") {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test subscriptions kunnen niet worden aangemaakt in productie");
  }

  return await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dagen
      cancelAtPeriodEnd: false,
    },
    update: {
      plan,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });
}

