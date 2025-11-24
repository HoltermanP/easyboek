"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInvoice(formData: FormData) {
  const user = await requireAuth();

  const companyId = formData.get("companyId") as string;
  const customerId = formData.get("customerId") as string;
  const number = formData.get("number") as string;
  const date = formData.get("date") as string;
  const dueDate = formData.get("dueDate") as string;
  const itemsJson = formData.get("items") as string;
  const total = formData.get("total") as string;
  const vatTotal = formData.get("vatTotal") as string;

  if (!companyId || !customerId || !number || !date || !dueDate) {
    return { error: "Alle verplichte velden moeten worden ingevuld" };
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

  // Check if invoice number is unique
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      companyId,
      number,
    },
  });

  if (existingInvoice) {
    return { error: "Factuurnummer bestaat al" };
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId,
        number,
        date: new Date(date),
        dueDate: new Date(dueDate),
        items: JSON.parse(itemsJson),
        total: parseFloat(total),
        vatTotal: parseFloat(vatTotal),
        status: "draft",
      },
    });

    // Boek de factuur volgens Nederlandse boekhoudregels
    // Bij aanmaken factuur: 
    // - Debiteuren (1300) debet = totaal incl. BTW
    // - Omzet (8000) credit = totaal excl. BTW
    // - BTW te ontvangen (1500) credit = BTW bedrag
    await bookInvoice(
      invoice.id, 
      company.id, 
      user.id, 
      parseFloat(total),
      parseFloat(vatTotal)
    );

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bookings");

    return { success: true, invoice };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { error: "Fout bij aanmaken factuur" };
  }
}

/**
 * Boek een factuur volgens Nederlandse boekhoudregels
 * Bij aanmaken: 
 * - Debiteuren (1300) debet = totaal incl. BTW
 * - Omzet (8000) credit = totaal excl. BTW
 * - BTW te ontvangen (1500) credit = BTW bedrag
 */
async function bookInvoice(
  invoiceId: string,
  companyId: string,
  userId: string,
  totalInclVat: number,
  vatTotal: number
) {
  try {
    // Haal factuur op voor omschrijving
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new Error("Factuur niet gevonden");
    }

    const omzetExclVat = totalInclVat - vatTotal;

    // Zoek of maak Debiteuren rekening (1300)
    let debiteurenAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId,
        code: "1300",
      },
    });

    if (!debiteurenAccount) {
      debiteurenAccount = await prisma.ledgerAccount.create({
        data: {
          companyId,
          code: "1300",
          name: "Debiteuren",
          type: "balance",
        },
      });
    }

    // Zoek of maak Omzet rekening (8000)
    let omzetAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId,
        code: "8000",
      },
    });

    if (!omzetAccount) {
      omzetAccount = await prisma.ledgerAccount.create({
        data: {
          companyId,
          code: "8000",
          name: "Omzet",
          type: "result",
        },
      });
    }

    // Zoek of maak BTW te ontvangen rekening (1500)
    let btwAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId,
        code: "1500",
      },
    });

    if (!btwAccount) {
      btwAccount = await prisma.ledgerAccount.create({
        data: {
          companyId,
          code: "1500",
          name: "BTW te ontvangen",
          type: "balance",
        },
      });
    }

    // Boeking 1: Debiteuren debet, Omzet credit (zonder BTW)
    await prisma.booking.create({
      data: {
        companyId,
        date: invoice.date,
        description: `Factuur ${invoice.number} - ${invoice.customer.name} (omzet)`,
        debitAccountId: debiteurenAccount.id, // Debiteuren (activa) debet
        creditAccountId: omzetAccount.id, // Omzet (opbrengsten) credit
        amount: omzetExclVat,
        vatCode: null,
        createdBy: userId,
      },
    });

    // Boeking 2: Debiteuren debet, BTW te ontvangen credit (alleen als er BTW is)
    if (vatTotal > 0) {
      await prisma.booking.create({
        data: {
          companyId,
          date: invoice.date,
          description: `Factuur ${invoice.number} - ${invoice.customer.name} (BTW)`,
          debitAccountId: debiteurenAccount.id, // Debiteuren (activa) debet
          creditAccountId: btwAccount.id, // BTW te ontvangen (passiva) credit
          amount: vatTotal,
          vatCode: null,
          createdBy: userId,
        },
      });
    }

    console.log(`Factuur ${invoice.number} geboekt: Debiteuren €${totalInclVat}, Omzet €${omzetExclVat}, BTW €${vatTotal}`);
  } catch (error) {
    console.error("Error booking invoice:", error);
    // Gooi de fout door zodat de factuur niet wordt aangemaakt als boeking faalt
    throw error;
  }
}

/**
 * Markeer factuur als betaald en boek de betaling
 * Bij betaling: Bank (1000) debet, Debiteuren (1300) credit
 */
export async function markInvoiceAsPaid(formData: FormData) {
  const user = await requireAuth();
  
  const invoiceId = formData.get("invoiceId") as string;
  const paymentDate = formData.get("paymentDate") as string;

  if (!invoiceId) {
    return { error: "Factuur ID is verplicht" };
  }

  // Haal factuur op
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      company: {
        ownerId: user.id,
      },
    },
    include: {
      company: true,
      customer: true,
    },
  });

  if (!invoice) {
    return { error: "Factuur niet gevonden" };
  }

  if (invoice.status === "paid") {
    return { error: "Factuur is al gemarkeerd als betaald" };
  }

  try {
    // Update factuur status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
      },
    });

    // Boek de betaling: Bank debet, Debiteuren credit
    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    // Zoek of maak Bank rekening (1000)
    let bankAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId: invoice.companyId,
        code: "1000",
      },
    });

    if (!bankAccount) {
      bankAccount = await prisma.ledgerAccount.create({
        data: {
          companyId: invoice.companyId,
          code: "1000",
          name: "Bank",
          type: "balance",
        },
      });
    }

    // Zoek Debiteuren rekening (1300)
    let debiteurenAccount = await prisma.ledgerAccount.findFirst({
      where: {
        companyId: invoice.companyId,
        code: "1300",
      },
    });

    if (!debiteurenAccount) {
      debiteurenAccount = await prisma.ledgerAccount.create({
        data: {
          companyId: invoice.companyId,
          code: "1300",
          name: "Debiteuren",
          type: "balance",
        },
      });
    }

    // Maak betalingsboeking: Bank debet, Debiteuren credit
    await prisma.booking.create({
      data: {
        companyId: invoice.companyId,
        date: paymentDateObj,
        description: `Betaling factuur ${invoice.number} - ${invoice.customer.name}`,
        debitAccountId: bankAccount.id, // Bank (activa) debet
        creditAccountId: debiteurenAccount.id, // Debiteuren (activa) credit
        amount: Number(invoice.total),
        vatCode: null,
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/invoices/[id]");
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    return { error: "Fout bij markeren factuur als betaald" };
  }
}



