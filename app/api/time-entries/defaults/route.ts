import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Haal standaard uren op op basis van vorige weken
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");
    const weekStart = searchParams.get("weekStart"); // YYYY-MM-DD format

    if (!companyId || !weekStart) {
      return NextResponse.json(
        { error: "companyId en weekStart zijn verplicht" },
        { status: 400 }
      );
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

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    // Haal uren op van dezelfde weekdagen in de afgelopen 4 weken
    const fourWeeksAgo = new Date(weekStartDate);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weken terug

    const historicalEntries = await prisma.timeEntry.findMany({
      where: {
        companyId,
        date: {
          gte: fourWeeksAgo,
          lt: weekStartDate, // Tot maar niet inclusief de huidige week
        },
        invoiceId: null, // Alleen niet-gefactureerde uren
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
      orderBy: {
        date: "asc",
      },
    });

    // Groepeer per weekdag (0 = zondag, 1 = maandag, etc.) en klant
    const defaultsByDayAndCustomer: Record<string, Record<string, any>> = {};

    historicalEntries.forEach((entry) => {
      const dayOfWeek = entry.date.getDay();
      const customerId = entry.customerId;

      if (!defaultsByDayAndCustomer[dayOfWeek]) {
        defaultsByDayAndCustomer[dayOfWeek] = {};
      }

      if (!defaultsByDayAndCustomer[dayOfWeek][customerId]) {
        defaultsByDayAndCustomer[dayOfWeek][customerId] = {
          customerId,
          customer: entry.customer,
          hours: [],
          descriptions: [],
        };
      }

      defaultsByDayAndCustomer[dayOfWeek][customerId].hours.push(Number(entry.hours));
      if (entry.description) {
        defaultsByDayAndCustomer[dayOfWeek][customerId].descriptions.push(entry.description);
      }
    });

    // Bereken gemiddelden per weekdag en klant
    const defaults: any[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();

      const dayDefaults = defaultsByDayAndCustomer[dayOfWeek] || {};

      Object.values(dayDefaults).forEach((defaultData: any) => {
        const avgHours =
          defaultData.hours.length > 0
            ? defaultData.hours.reduce((a: number, b: number) => a + b, 0) /
              defaultData.hours.length
            : 0;

        // Gebruik meest voorkomende beschrijving of laat leeg
        const mostCommonDescription =
          defaultData.descriptions.length > 0
            ? defaultData.descriptions.sort(
                (a: string, b: string) =>
                  defaultData.descriptions.filter((d: string) => d === a).length -
                  defaultData.descriptions.filter((d: string) => d === b).length
              )[0]
            : null;

        if (avgHours > 0) {
          defaults.push({
            date: currentDate.toISOString().split("T")[0],
            customerId: defaultData.customerId,
            customer: defaultData.customer,
            hours: Math.round(avgHours * 100) / 100, // Rond af op 2 decimalen
            description: mostCommonDescription,
            hourlyRate: defaultData.customer.hourlyRate,
          });
        }
      });
    }

    return NextResponse.json({ defaults });
  } catch (error) {
    console.error("Error fetching default time entries:", error);
    return NextResponse.json(
      { error: "Fout bij ophalen standaard uren" },
      { status: 500 }
    );
  }
}







