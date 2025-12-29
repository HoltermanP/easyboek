import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Haal de huidige gebruiker op via Clerk en sync met database
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // Haal Clerk user data op
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    // Sync met database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || null,
      },
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

    return user;
  } catch (error: any) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

/**
 * Vereis authenticatie - gooit error als niet ingelogd
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Gebruiker niet gevonden");
  }
  return user;
}

/**
 * Vereis admin rechten
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

/**
 * Haal de geselecteerde company op voor de gebruiker
 */
export async function getSelectedCompany(userId: string) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const selectedCompanyId = cookieStore.get("selectedCompanyId")?.value;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          orderBy: {
            year: "desc",
          },
        },
      },
    });

    if (!user || user.companies.length === 0) {
      return null;
    }

    if (selectedCompanyId) {
      const selected = user.companies.find((c) => c.id === selectedCompanyId);
      if (selected) {
        return selected;
      }
    }

    return user.companies[0];
  } catch (error) {
    console.error("Error in getSelectedCompany:", error);
    return null;
  }
}
