import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Haal uren op voor een periode
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerId = searchParams.get("customerId");

    if (!companyId) {
      return NextResponse.json({ error: "companyId is verplicht" }, { status: 400 });
    }

    // Check of gebruiker eigenaar is van het bedrijf
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        ownerId: user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    const where: any = {
      companyId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Fout bij ophalen urenregistratie" },
      { status: 500 }
    );
  }
}

// POST: Maak nieuwe urenregistratie aan
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, customerId, date, hours, description, hourlyRate } = body;

    if (!companyId || !customerId || !date || !hours) {
      return NextResponse.json(
        { error: "companyId, customerId, date en hours zijn verplicht" },
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
        customers: {
          where: { id: customerId },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    if (company.customers.length === 0) {
      return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
    }

    const customer = company.customers[0];
    // Gebruik uurtarief van klant als geen uurtarief is opgegeven
    const finalHourlyRate = hourlyRate || customer.hourlyRate || null;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        companyId,
        customerId,
        date: new Date(date),
        hours: parseFloat(hours),
        description: description || null,
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

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Fout bij aanmaken urenregistratie" },
      { status: 500 }
    );
  }
}

// PUT: Update urenregistratie
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, hours, description, hourlyRate } = body;

    if (!id) {
      return NextResponse.json({ error: "id is verplicht" }, { status: 400 });
    }

    // Check of urenregistratie bestaat en gebruiker eigenaar is
    const timeEntry = await prisma.timeEntry.findFirst({
      where: { id },
      include: {
        company: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Urenregistratie niet gevonden" },
        { status: 404 }
      );
    }

    if (timeEntry.company.ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check of uren al gefactureerd zijn
    if (timeEntry.invoiceId) {
      return NextResponse.json(
        { error: "Deze uren zijn al gefactureerd en kunnen niet worden aangepast" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (description !== undefined) updateData.description = description || null;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate || null;

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ timeEntry: updatedTimeEntry });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Fout bij bijwerken urenregistratie" },
      { status: 500 }
    );
  }
}

// DELETE: Verwijder urenregistratie
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is verplicht" }, { status: 400 });
    }

    // Check of urenregistratie bestaat en gebruiker eigenaar is
    const timeEntry = await prisma.timeEntry.findFirst({
      where: { id },
      include: {
        company: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Urenregistratie niet gevonden" },
        { status: 404 }
      );
    }

    if (timeEntry.company.ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check of uren al gefactureerd zijn
    if (timeEntry.invoiceId) {
      return NextResponse.json(
        { error: "Deze uren zijn al gefactureerd en kunnen niet worden verwijderd" },
        { status: 400 }
      );
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Fout bij verwijderen urenregistratie" },
      { status: 500 }
    );
  }
}







