import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Decimal } from "@prisma/client/runtime/library";
import { UpdateTaxRulesButton } from "@/components/tax/UpdateTaxRulesButton";
import { Receipt, TrendingUp, Gift, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

async function getCompanyAndTaxRules(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: {
        include: {
          taxRules: true,
        },
        orderBy: {
          year: "desc",
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  return user.companies;
}

const formatPercentage = (value: number | string | Decimal | null | undefined) => {
  if (value === null || value === undefined) return "-";
  const numValue = value instanceof Decimal ? Number(value) : typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(numValue)) return "-";
  return `${numValue.toFixed(2)}%`;
};

const formatCurrency = (value: number | string | Decimal | null | undefined) => {
  if (value === null || value === undefined) return "-";
  const numValue = value instanceof Decimal ? Number(value) : typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(numValue)) return "-";
  return `€${numValue.toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default async function TaxRulesPage() {
  try {
    const user = await requireAuth();
    const companies = await getCompanyAndTaxRules(user.clerkId);

    if (!companies || companies.length === 0) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Belastingregels</h1>
          <Card>
            <CardHeader>
              <CardTitle>Geen bedrijf gevonden</CardTitle>
              <CardDescription>
                Maak eerst een bedrijf aan om belastingregels te bekijken.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Belastingregels</h1>
          <p className="text-muted-foreground">
            Overzicht van belastingregels per administratie jaar
          </p>
        </div>
      </div>

      <Tabs defaultValue={companies.length > 0 ? companies[0].id : undefined} className="space-y-6">
        <TabsList className="inline-flex w-full overflow-x-auto">
          {companies.map((company) => (
            <TabsTrigger key={company.id} value={company.id} className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-semibold">{company.name}</span>
              <Badge variant="outline">{company.year}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {companies.map((company) => (
          <TabsContent key={company.id} value={company.id} className="space-y-6">
            {company.taxRules ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Belastingregels {company.year}</h2>
                    <p className="text-sm text-muted-foreground">
                      Laatst bijgewerkt: {company.taxRules.lastUpdated
                        ? new Date(company.taxRules.lastUpdated).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Onbekend"}
                    </p>
                  </div>
                  <UpdateTaxRulesButton
                    companyId={company.id}
                    year={company.year}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <CardTitle>BTW Tarieven</CardTitle>
                      </div>
                      <CardDescription>
                        Geldende BTW tarieven voor {company.year}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">Standaard tarief</div>
                            <div className="text-sm text-muted-foreground">Voor de meeste goederen en diensten</div>
                          </div>
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {formatPercentage(company.taxRules.vatStandardRate)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">Verlaagd tarief</div>
                            <div className="text-sm text-muted-foreground">Voor o.a. voedingsmiddelen, boeken</div>
                          </div>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {formatPercentage(company.taxRules.vatReducedRate)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">Nul tarief</div>
                            <div className="text-sm text-muted-foreground">Voor export en bepaalde diensten</div>
                          </div>
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {formatPercentage(company.taxRules.vatZeroRate)}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Aangifte frequentie</div>
                            <div className="text-sm text-muted-foreground">Hoe vaak BTW aangifte doen</div>
                          </div>
                          <Badge>
                            {company.taxRules.vatFilingFrequency === "quarterly"
                              ? "Per kwartaal"
                              : company.taxRules.vatFilingFrequency === "monthly"
                              ? "Maandelijks"
                              : "Jaarlijks"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle>Inkomstenbelasting</CardTitle>
                      </div>
                      <CardDescription>
                        Tarieven en schijven voor {company.year}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {company.taxRules.incomeTaxRate1 ? (
                        <div className="space-y-3">
                          {company.taxRules.incomeTaxRate1 && (
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Schijf 1</span>
                                <Badge variant="default">
                                  {formatPercentage(company.taxRules.incomeTaxRate1)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {company.taxRules.incomeTaxBracket1
                                  ? `Tot ${formatCurrency(company.taxRules.incomeTaxBracket1)}`
                                  : "Tot eerste schijf"}
                              </div>
                            </div>
                          )}
                          {company.taxRules.incomeTaxRate2 && (
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Schijf 2</span>
                                <Badge variant="default">
                                  {formatPercentage(company.taxRules.incomeTaxRate2)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {company.taxRules.incomeTaxBracket2
                                  ? `Tot ${formatCurrency(company.taxRules.incomeTaxBracket2)}`
                                  : "Tot tweede schijf"}
                              </div>
                            </div>
                          )}
                          {company.taxRules.incomeTaxRate3 && (
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Schijf 3</span>
                                <Badge variant="default">
                                  {formatPercentage(company.taxRules.incomeTaxRate3)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {company.taxRules.incomeTaxBracket3
                                  ? `Tot ${formatCurrency(company.taxRules.incomeTaxBracket3)}`
                                  : "Tot derde schijf"}
                              </div>
                            </div>
                          )}
                          {company.taxRules.incomeTaxRate4 && (
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">Schijf 4</span>
                                <Badge variant="default">
                                  {formatPercentage(company.taxRules.incomeTaxRate4)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Boven schijf 3
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Geen inkomstenbelasting gegevens beschikbaar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <CardTitle>Kortingen en Aftrekposten</CardTitle>
                    </div>
                    <CardDescription>
                      Beschikbare kortingen en aftrekposten voor ZZP&apos;ers in {company.year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(company.taxRules.generalTaxCredit ||
                      company.taxRules.employmentTaxCredit !== null ||
                      company.taxRules.selfEmployedDeduction ||
                      company.taxRules.smeProfitExemption) ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {company.taxRules.generalTaxCredit && (
                          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                            <div className="font-medium mb-1">Algemene heffingskorting</div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(company.taxRules.generalTaxCredit)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Automatische korting op inkomstenbelasting
                            </div>
                          </div>
                        )}
                        {company.taxRules.employmentTaxCredit !== null &&
                          company.taxRules.employmentTaxCredit !== undefined && (
                            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                              <div className="font-medium mb-1">Arbeidskorting</div>
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {formatCurrency(company.taxRules.employmentTaxCredit)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Korting voor werkenden
                              </div>
                            </div>
                          )}
                        {company.taxRules.selfEmployedDeduction && (
                          <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                            <div className="font-medium mb-1">Zelfstandigenaftrek</div>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                              {formatCurrency(company.taxRules.selfEmployedDeduction)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Aftrek voor zelfstandigen
                            </div>
                          </div>
                        )}
                        {company.taxRules.smeProfitExemption && (
                          <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                            <div className="font-medium mb-1">MKB-winstvrijstelling</div>
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                              {formatPercentage(company.taxRules.smeProfitExemption)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Percentage van winst vrijgesteld
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Geen kortingen en aftrekposten beschikbaar
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      <CardTitle>Informatie</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Bron:</span>
                        <Badge variant="outline">{company.taxRules.source || "Onbekend"}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Laatst bijgewerkt:</span>
                        <span className="text-sm">
                          {company.taxRules.lastUpdated
                            ? new Date(company.taxRules.lastUpdated).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Onbekend"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Info className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Geen belastingregels gevonden</CardTitle>
                    <CardDescription className="mb-6 max-w-md">
                      Er zijn nog geen belastingregels ingesteld voor {company.name} {company.year}.
                      Klik op de knop hieronder om automatisch de nieuwste regels op te halen via OpenAI.
                    </CardDescription>
                    <UpdateTaxRulesButton
                      companyId={company.id}
                      year={company.year}
                    />
                  </div>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
  } catch (error) {
    console.error("Error in TaxRulesPage:", error);
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Belastingregels</h1>
        <Card>
          <CardHeader>
            <CardTitle>Fout</CardTitle>
            <CardDescription>
              Er is een fout opgetreden bij het laden van de belastingregels.
              {error instanceof Error && (
                <div className="mt-2 text-sm text-red-600">{error.message}</div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
}

