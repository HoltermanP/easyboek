import { prisma } from "./prisma";

/**
 * Simpel auth systeem zonder Clerk
 * Haal de eerste gebruiker op of maak een demo gebruiker aan
 */
export async function getCurrentUser() {
  try {
    // Haal de eerste gebruiker op, of maak een demo gebruiker aan
    let user = await prisma.user.findFirst();

    if (!user) {
      // Maak een demo gebruiker aan
      user = await prisma.user.create({
        data: {
          email: "demo@easyboek.nl",
          name: "Demo Gebruiker",
          role: "user",
        },
      });
    }

    return user;
  } catch (error: any) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Gebruiker niet gevonden");
  }
  return user;
}

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

