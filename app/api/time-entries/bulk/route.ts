import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST: Maak meerdere urenregistraties aan in één keer
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, entries } = body;

    if (!companyId || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "companyId en entries array zijn verplicht" },
        { status: 400 }
      );
    }

    // Check of gebruiker eigenaar is van het bedrijf
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: user.id,
      },
      include: {
        customers: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    // Valideer alle entries
    const customerMap = new Map(company.customers.map(c => [c.id, c]));
    
    for (const entry of entries) {
      if (!entry.customerId || !entry.date || entry.hours === undefined) {
        return NextResponse.json(
          { error: "Elke entry moet customerId, date en hours hebben" },
          { status: 400 }
        );
      }
      if (!customerMap.has(entry.customerId)) {
        return NextResponse.json(
          { error: `Klant ${entry.customerId} niet gevonden` },
          { status: 404 }
        );
      }
    }

    // Maak alle entries aan
    const timeEntries = await Promise.all(
      entries.map(async (entry) => {
        const customer = customerMap.get(entry.customerId)!;
        const finalHourlyRate = entry.hourlyRate || customer.hourlyRate || null;

        return prisma.timeEntry.create({
          data: {
            companyId,
            customerId: entry.customerId,
            date: new Date(entry.date),
            hours: parseFloat(entry.hours),
            description: entry.description || null,
            hourlyRate: finalHourlyRate,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                hourlyRate: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error("Error creating bulk time entries:", error);
    return NextResponse.json(
      { error: "Fout bij aanmaken urenregistraties" },
      { status: 500 }
    );
  }
}







