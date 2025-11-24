import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateBookingInput {
  companyId: string;
  date: Date;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  vatCode?: string;
  createdBy: string;
}

/**
 * Maakt een double-entry boeking aan
 * Valideert dat beide rekeningen bestaan en bij het bedrijf horen
 */
export async function createBooking(input: CreateBookingInput) {
  // Valideer dat beide rekeningen bestaan en bij het bedrijf horen
  const [debitAccount, creditAccount] = await Promise.all([
    prisma.ledgerAccount.findFirst({
      where: {
        id: input.debitAccountId,
        companyId: input.companyId,
      },
    }),
    prisma.ledgerAccount.findFirst({
      where: {
        id: input.creditAccountId,
        companyId: input.companyId,
      },
    }),
  ]);

  if (!debitAccount) {
    throw new Error(`Debet rekening ${input.debitAccountId} niet gevonden`);
  }

  if (!creditAccount) {
    throw new Error(`Credit rekening ${input.creditAccountId} niet gevonden`);
  }

  // Maak de boeking aan
  const booking = await prisma.booking.create({
    data: {
      companyId: input.companyId,
      date: input.date,
      description: input.description,
      debitAccountId: input.debitAccountId,
      creditAccountId: input.creditAccountId,
      amount: new Decimal(input.amount),
      vatCode: input.vatCode,
      createdBy: input.createdBy,
    },
    include: {
      debitAccount: true,
      creditAccount: true,
    },
  });

  return booking;
}



