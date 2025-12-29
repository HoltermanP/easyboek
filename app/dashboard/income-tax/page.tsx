import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeTaxForm } from "@/components/tax/IncomeTaxForm";
import { IncomeTaxCalculation } from "@/components/tax/IncomeTaxCalculation";
import { calculateIncomeTax } from "@/services/tax/calculateIncomeTax";
import { Calculator, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getCompanyData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          incomeTaxData: true,
          taxRules: true,
        },
        orderBy: {
          year: "desc",
        },
      },
    },
  });

  return user?.companies || [];
}

export default async function IncomeTaxPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inkomstenbelasting</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const companies = await getCompanyData(user.id);

  if (!companies || companies.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inkomstenbelasting</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen bedrijf gevonden</CardTitle>
            <CardDescription>
              Maak eerst een bedrijf aan om inkomstenbelasting te berekenen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Bereken inkomstenbelasting voor elk bedrijf
  const calculations = await Promise.all(
    companies.map(async (company) => {
      if (!company.taxRules) {
        return { company, calculation: null };
      }

      try {
        const startOfYear = new Date(company.year, 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(company.year, 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        const calculation = await calculateIncomeTax(company.id, startOfYear, endOfYear);
        return { company, calculation };
      } catch (error) {
        console.error(`Error calculating income tax for company ${company.id}:`, error);
        return { company, calculation: null };
      }
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inkomstenbelasting</h1>
        <p className="text-muted-foreground">
          Vul uw persoonlijke belastinggegevens in en bekijk de berekening
        </p>
      </div>

      <Tabs defaultValue={companies.length > 0 ? companies[0].id : undefined} className="space-y-6">
        <TabsList className="inline-flex w-full overflow-x-auto">
          {companies.map((company) => (
            <TabsTrigger key={company.id} value={company.id} className="flex items-center gap-2 whitespace-nowrap">
              {company.name} ({company.year})
            </TabsTrigger>
          ))}
        </TabsList>

        {calculations.map(({ company, calculation }) => (
          <TabsContent key={company.id} value={company.id} className="space-y-6">
            <Tabs defaultValue="form" className="space-y-4">
              <TabsList>
                <TabsTrigger value="form" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Gegevens Invoeren
                </TabsTrigger>
                <TabsTrigger value="calculation" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Berekening
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form">
                <IncomeTaxForm
                  companyId={company.id}
                  year={company.year}
                  initialData={company.incomeTaxData ? {
                    id: company.incomeTaxData.id,
                    companyId: company.incomeTaxData.companyId,
                    year: company.incomeTaxData.year,
                    maritalStatus: company.incomeTaxData.maritalStatus,
                    otherIncome: company.incomeTaxData.otherIncome ? Number(company.incomeTaxData.otherIncome) : null,
                    mortgageInterest: company.incomeTaxData.mortgageInterest ? Number(company.incomeTaxData.mortgageInterest) : null,
                    healthcareCosts: company.incomeTaxData.healthcareCosts ? Number(company.incomeTaxData.healthcareCosts) : null,
                    educationCosts: company.incomeTaxData.educationCosts ? Number(company.incomeTaxData.educationCosts) : null,
                    otherDeductions: company.incomeTaxData.otherDeductions ? Number(company.incomeTaxData.otherDeductions) : null,
                    partnerIncome: company.incomeTaxData.partnerIncome ? Number(company.incomeTaxData.partnerIncome) : null,
                  } : null}
                />
              </TabsContent>

              <TabsContent value="calculation">
                <IncomeTaxCalculation calculation={calculation} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

