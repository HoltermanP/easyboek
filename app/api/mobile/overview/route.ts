import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfitAndLoss } from "@/services/reports/reports";
import { calculateMonthlyReservationAdvice } from "@/services/tax/reservationAdvice";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Haal bedrijf op
    const userWithCompanies = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companies: true,
      },
    });

    if (!userWithCompanies || userWithCompanies.companies.length === 0) {
      return NextResponse.json(
        { error: "Geen bedrijf gevonden" },
        { status: 404 }
      );
    }

    const company = userWithCompanies.companies[0];
    const now = new Date();

    // Huidige maand
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Bereken winst & verlies voor deze maand
    const pnl = await calculateProfitAndLoss(company.id, startOfMonth, endOfMonth);
    
    // Inkomsten (opbrengsten)
    const inkomsten = pnl.revenue.total;
    
    // Uitgaven (kosten)
    const uitgaven = pnl.costs.total;
    
    // Winst
    const winst = pnl.profit.total;

    // Verwachte inkomsten (openstaande facturen)
    const openstaandeFacturen = await prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: {
          in: ["sent", "draft"],
        },
      },
    });
    const verwachteInkomsten = openstaandeFacturen.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    // Reserveringsadvies
    let ibReservering = 0;
    let btwReservering = 0;
    
    try {
      const reservationAdvice = await calculateMonthlyReservationAdvice(company.id);
      ibReservering = reservationAdvice.incomeTaxReservation.recommendedReservation;
      btwReservering = reservationAdvice.vatReservation.recommendedReservation;
    } catch (error) {
      console.error("Error calculating reservation advice:", error);
      // Fallback: gebruik 40% van winst voor IB en BTW uit BTW overzicht
      if (winst > 0) {
        ibReservering = winst * 0.4;
      }
    }

    return NextResponse.json({
      inkomsten,
      uitgaven,
      winst,
      verwachteInkomsten,
      verwachteWinst: winst + (verwachteInkomsten - uitgaven),
      ibReservering,
      btwReservering,
      periode: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in mobile overview:", error);
    return NextResponse.json(
      { error: "Fout bij ophalen overzicht" },
      { status: 500 }
    );
  }
}

