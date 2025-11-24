import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  // Sync user with database
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        role: "user",
      },
    });
  }

  return dbUser;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
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
 * Gebruikt cookie of eerste company als fallback
 */
export async function getSelectedCompany(userId: string) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const selectedCompanyId = cookieStore.get("selectedCompanyId")?.value;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
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

  // Als er een geselecteerde company is, gebruik die, anders de eerste
  if (selectedCompanyId) {
    const selected = user.companies.find((c) => c.id === selectedCompanyId);
    if (selected) {
      return selected;
    }
  }

  // Fallback naar eerste company
  return user.companies[0];
}



