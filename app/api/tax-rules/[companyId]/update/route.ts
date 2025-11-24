import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTaxRulesFromAI } from "@/services/tax/fetchTaxRulesFromAI";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const user = await requireAuth();
    const { companyId } = params;

    // Check of company bij gebruiker hoort
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        owner: {
          clerkId: user.clerkId,
        },
      },
      include: {
        taxRules: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Bedrijf niet gevonden" },
        { status: 404 }
      );
    }

    // Haal belastingregels op (hybride: statisch + OpenAI)
    const taxRulesData = await fetchTaxRulesFromAI(company.year);

    // Update of maak tax rules aan
    const taxRules = company.taxRules
      ? await prisma.taxRules.update({
          where: { id: company.taxRules.id },
          data: {
            // Update alle velden (zijn nu altijd compleet door hybride aanpak)
            vatStandardRate: taxRulesData.vatStandardRate ?? 21.0,
            vatReducedRate: taxRulesData.vatReducedRate ?? 9.0,
            vatZeroRate: taxRulesData.vatZeroRate ?? 0.0,
            incomeTaxRate1: taxRulesData.incomeTaxRate1,
            incomeTaxRate2: taxRulesData.incomeTaxRate2,
            incomeTaxRate3: taxRulesData.incomeTaxRate3,
            incomeTaxRate4: taxRulesData.incomeTaxRate4,
            incomeTaxBracket1: taxRulesData.incomeTaxBracket1,
            incomeTaxBracket2: taxRulesData.incomeTaxBracket2,
            incomeTaxBracket3: taxRulesData.incomeTaxBracket3,
            generalTaxCredit: taxRulesData.generalTaxCredit,
            employmentTaxCredit: taxRulesData.employmentTaxCredit,
            selfEmployedDeduction: taxRulesData.selfEmployedDeduction,
            smeProfitExemption: taxRulesData.smeProfitExemption,
            vatFilingFrequency: taxRulesData.vatFilingFrequency || "quarterly",
            source: taxRulesData.source || "Hybride (Statisch + OpenAI)",
            additionalRules: taxRulesData.additionalRules || {},
            lastUpdated: new Date(),
          },
        })
      : await prisma.taxRules.create({
          data: {
            companyId: company.id,
            year: company.year,
            vatStandardRate: taxRulesData.vatStandardRate ?? 21.0,
            vatReducedRate: taxRulesData.vatReducedRate ?? 9.0,
            vatZeroRate: taxRulesData.vatZeroRate ?? 0.0,
            incomeTaxRate1: taxRulesData.incomeTaxRate1,
            incomeTaxRate2: taxRulesData.incomeTaxRate2,
            incomeTaxRate3: taxRulesData.incomeTaxRate3,
            incomeTaxRate4: taxRulesData.incomeTaxRate4,
            incomeTaxBracket1: taxRulesData.incomeTaxBracket1,
            incomeTaxBracket2: taxRulesData.incomeTaxBracket2,
            incomeTaxBracket3: taxRulesData.incomeTaxBracket3,
            generalTaxCredit: taxRulesData.generalTaxCredit,
            employmentTaxCredit: taxRulesData.employmentTaxCredit,
            selfEmployedDeduction: taxRulesData.selfEmployedDeduction,
            smeProfitExemption: taxRulesData.smeProfitExemption,
            vatFilingFrequency: taxRulesData.vatFilingFrequency || "quarterly",
            source: taxRulesData.source || "Hybride (Statisch + OpenAI)",
            additionalRules: taxRulesData.additionalRules || {},
          },
        });

    revalidatePath("/dashboard/tax-rules");

    return NextResponse.json({
      success: true,
      taxRules,
      message: "Belastingregels bijgewerkt",
    });
  } catch (error) {
    console.error("Error updating tax rules:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fout bij ophalen belastingregels",
      },
      { status: 500 }
    );
  }
}

