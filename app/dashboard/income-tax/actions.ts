"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveIncomeTaxData(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const companyId = formData.get("companyId") as string;
  const maritalStatus = formData.get("maritalStatus") as string;
  const otherIncome = parseFloat(formData.get("otherIncome") as string) || 0;
  const mortgageInterest = parseFloat(formData.get("mortgageInterest") as string) || 0;
  const healthcareCosts = parseFloat(formData.get("healthcareCosts") as string) || 0;
  const educationCosts = parseFloat(formData.get("educationCosts") as string) || 0;
  const otherDeductions = parseFloat(formData.get("otherDeductions") as string) || 0;
  const partnerIncome = parseFloat(formData.get("partnerIncome") as string) || 0;

  if (!companyId) {
    return { error: "Bedrijf ID is verplicht" };
  }

  // Check if company belongs to user
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      ownerId: user.id,
    },
  });

  if (!company) {
    return { error: "Bedrijf niet gevonden" };
  }

  try {
    // Check if income tax data already exists
    const existing = await prisma.incomeTaxData.findUnique({
      where: { companyId },
    });

    if (existing) {
      // Update existing
      await prisma.incomeTaxData.update({
        where: { companyId },
        data: {
          maritalStatus,
          otherIncome,
          mortgageInterest,
          healthcareCosts,
          educationCosts,
          otherDeductions,
          partnerIncome,
        },
      });
    } else {
      // Create new
      await prisma.incomeTaxData.create({
        data: {
          companyId,
          year: company.year,
          maritalStatus,
          otherIncome,
          mortgageInterest,
          healthcareCosts,
          educationCosts,
          otherDeductions,
          partnerIncome,
        },
      });
    }

    revalidatePath("/dashboard/income-tax");
    revalidatePath("/dashboard/reports");

    return { success: true };
  } catch (error) {
    console.error("Error saving income tax data:", error);
    return { error: "Fout bij opslaan belastinggegevens" };
  }
}

