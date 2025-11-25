import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyTaxRules } from "@/services/tax/getCompanyTaxRules";

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const user = await getCurrentUser();
    const { companyId } = params;

    // Check of company bij gebruiker hoort
    const { prisma } = await import("@/lib/prisma");
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        owner: {
          id: user!.id,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Bedrijf niet gevonden" },
        { status: 404 }
      );
    }

    // Haal belastingregels op
    const taxRules = await getCompanyTaxRules(companyId);

    return NextResponse.json({
      vatStandardRate: Number(taxRules.vatStandardRate),
      vatReducedRate: Number(taxRules.vatReducedRate),
      vatZeroRate: Number(taxRules.vatZeroRate),
      year: taxRules.year,
    });
  } catch (error) {
    console.error("Error fetching tax rules:", error);
    return NextResponse.json(
      { error: "Fout bij ophalen belastingregels" },
      { status: 500 }
    );
  }
}

