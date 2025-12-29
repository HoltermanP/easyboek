import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

/**
 * Check of gebruiker een actief abonnement heeft
 * Developer accounts hebben altijd toegang
 * Proefabonnementen zijn actief tot trialEndsAt
 */
export async function hasActiveSubscription(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) return false;

  // Developer accounts hebben altijd toegang
  if (user.isDeveloper) {
    return true;
  }

  const subscription = user.subscription;

  if (!subscription) {
    return false;
  }

  // Check proefabonnement
  if (subscription.isTrial && subscription.trialEndsAt) {
    const now = new Date();
    if (now > subscription.trialEndsAt) {
      // Proefperiode is verlopen
      return false;
    }
    return true;
  }

  // Check normale subscription status
  return subscription.status === "active" || subscription.status === "trialing";
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
 * Check of gebruiker een proefabonnement heeft dat binnenkort verloopt
 */
export async function isTrialExpiringSoon(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const subscription = await getUserSubscription(userId);
  
  if (!subscription || !subscription.isTrial || !subscription.trialEndsAt) {
    return false;
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Waarschuw 7 dagen voor verloop
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Maak een test subscription aan (alleen voor development)
 */
export async function createTestSubscription(userId: string, plan: "basis" | "premium" = "premium") {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test subscriptions kunnen niet worden aangemaakt in productie");
  }

  // Jaarlijks contract met maandelijkse betalingen: 12 maanden vanaf nu
  const contractEndDate = new Date();
  contractEndDate.setMonth(contractEndDate.getMonth() + 12); // 12 maanden contract

  return await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: contractEndDate, // Einde van het jaarlijkse contract
      cancelAtPeriodEnd: false, // Niet opzegbaar tussentijds
    },
    update: {
      plan,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: contractEndDate,
      cancelAtPeriodEnd: false, // Niet opzegbaar tussentijds
    },
  });
}
