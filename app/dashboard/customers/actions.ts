"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const user = await requireAuth();
  
  const companyId = formData.get("companyId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const city = formData.get("city") as string | null;
  const postalCode = formData.get("postalCode") as string | null;
  const country = formData.get("country") as string | null;
  const kvkNumber = formData.get("kvkNumber") as string | null;
  const btwNumber = formData.get("btwNumber") as string | null;

  if (!companyId || !name) {
    return { error: "Bedrijfsnaam is verplicht" };
  }

  // Check if user owns the company
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
    await prisma.customer.create({
      data: {
        companyId: company.id,
        name,
        email: email || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || "NL",
        kvkNumber: kvkNumber || null,
        btwNumber: btwNumber || null,
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices/new");
    
    return { success: true };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { error: "Fout bij aanmaken klant" };
  }
}

export async function updateCustomer(formData: FormData) {
  const user = await requireAuth();
  
  const customerId = formData.get("customerId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const city = formData.get("city") as string | null;
  const postalCode = formData.get("postalCode") as string | null;
  const country = formData.get("country") as string | null;
  const kvkNumber = formData.get("kvkNumber") as string | null;
  const btwNumber = formData.get("btwNumber") as string | null;

  if (!customerId || !name) {
    return { error: "Naam is verplicht" };
  }

  // Check if user owns the customer's company
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      company: {
        ownerId: user.id,
      },
    },
  });

  if (!customer) {
    return { error: "Klant niet gevonden" };
  }

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        email: email || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || "NL",
        kvkNumber: kvkNumber || null,
        btwNumber: btwNumber || null,
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices/new");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { error: "Fout bij bijwerken klant" };
  }
}

export async function deleteCustomer(formData: FormData) {
  const user = await requireAuth();
  
  const customerId = formData.get("customerId") as string;

  if (!customerId) {
    return { error: "Klant ID is verplicht" };
  }

  // Check if user owns the customer's company
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      company: {
        ownerId: user.id,
      },
    },
    include: {
      invoices: true,
    },
  });

  if (!customer) {
    return { error: "Klant niet gevonden" };
  }

  // Check if customer has invoices
  if (customer.invoices.length > 0) {
    return { error: "Kan klant niet verwijderen omdat er facturen aan gekoppeld zijn" };
  }

  try {
    await prisma.customer.delete({
      where: { id: customerId },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices/new");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { error: "Fout bij verwijderen klant" };
  }
}

