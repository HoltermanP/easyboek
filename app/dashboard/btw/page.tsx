import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateVatOverview } from "@/services/btw/btw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import Link from "next/link";
import { BtwPeriodActions } from "./BtwPeriodActions";
import { PeriodSelector } from "./PeriodSelector";

export const dynamic = 'force-dynamic';

async function getVatData(userId: string, selectedPeriodId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          vatPeriods: {
            orderBy: {
              endDate: "desc",
            },
          },
          documents: {
            where: {
              status: {
                not: "booked",
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          invoices: {
            where: {
              status: {
                not: "paid",
              },
            },
            include: {
              customer: true,
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  const company = user.companies[0];
  
  // Vind geselecteerde periode of gebruik huidige
  let vatPeriod;
  if (selectedPeriodId) {
    vatPeriod = company.vatPeriods.find(p => p.id === selectedPeriodId);
  }
  
  if (!vatPeriod) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);

  // Vind of maak BTW periode
    vatPeriod = company.vatPeriods.find(
    (p) => p.startDate <= now && p.endDate >= now
  );

  if (!vatPeriod) {
    // Maak nieuwe periode aan
    vatPeriod = await prisma.vatPeriod.create({
      data: {
        companyId: company.id,
        startDate: startOfQuarter,
        endDate: endOfQuarter,
        status: "open",
      },
    });
    }
  }

  const vatOverview = await calculateVatOverview(
    company.id,
    vatPeriod.startDate,
    vatPeriod.endDate
  );

  // Filter nog niet geboekte documenten/facturen binnen de periode
  const unbookedDocuments = company.documents.filter(doc => {
    const docDate = new Date(doc.createdAt);
    return docDate >= vatPeriod.startDate && docDate <= vatPeriod.endDate;
  });

  const unbookedInvoices = company.invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate >= vatPeriod.startDate && invDate <= vatPeriod.endDate;
  });

  return {
    company,
    vatPeriod,
    vatPeriods: company.vatPeriods,
    vatOverview,
    unbookedDocuments,
    unbookedInvoices,
  };
}

export default async function BtwPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">BTW Overzicht</h1>
        <p className="text-muted-foreground">Gebruiker niet gevonden</p>
      </div>
    );
  }
  const data = await getVatData(user.id, searchParams.period);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">BTW Overzicht</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen bedrijf gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BTW Overzicht</h1>
        <p className="text-muted-foreground">
          BTW berekeningen voor {data.company.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BTW Periode</CardTitle>
          <CardDescription>
            Selecteer een periode om de BTW aangifte te bekijken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecteer periode:</label>
              <PeriodSelector periods={data.vatPeriods} selectedPeriodId={data.vatPeriod.id} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-sm font-medium">Periode:</span>
                <p className="text-sm text-muted-foreground">
                  {format(data.vatPeriod.startDate, "d MMMM", { locale: nl })} -{" "}
                  {format(data.vatPeriod.endDate, "d MMMM yyyy", { locale: nl })}
                </p>
              </div>
              <div className="text-right">
              <span className="text-sm font-medium">Status:</span>
                <div>
                  <Badge 
                    variant={
                      data.vatPeriod.status === "open" 
                        ? "secondary" 
                        : data.vatPeriod.status === "filed"
                        ? "default"
                        : data.vatPeriod.status === "reopened"
                        ? "outline"
                        : "default"
                    }
                  >
                {data.vatPeriod.status === "open"
                  ? "Open"
                  : data.vatPeriod.status === "ready"
                  ? "Klaar voor aangifte"
                      : data.vatPeriod.status === "filed"
                      ? "Ingediend"
                      : "Heropend (Suppletie)"}
              </Badge>
                </div>
              </div>
            </div>
            {data.vatOverview.taxRules && (
              <div className="pt-4 border-t space-y-2">
                <div className="text-sm font-medium">Geldende BTW Tarieven ({data.company.year}):</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Standaard:</span>{" "}
                    <Badge variant="default">{data.vatOverview.taxRules.standardRate}%</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Verlaagd:</span>{" "}
                    <Badge variant="secondary">{data.vatOverview.taxRules.reducedRate}%</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nul:</span>{" "}
                    <Badge variant="outline">{data.vatOverview.taxRules.zeroRate}%</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Aangifte frequentie: {data.vatOverview.taxRules.filingFrequency === "quarterly" ? "Per kwartaal" : data.vatOverview.taxRules.filingFrequency === "monthly" ? "Maandelijks" : "Jaarlijks"}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Omzet Belasting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.vatOverview.omzetBelasting.toLocaleString("nl-NL", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              BTW over verkopen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Voorbelasting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.vatOverview.voorbelasting.toLocaleString("nl-NL", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              BTW over inkoop (terug te vorderen)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Te Betalen BTW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.vatOverview.teBetalen.toLocaleString("nl-NL", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.vatOverview.teBetalen >= 0 ? "Te betalen" : "Terug te ontvangen"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturen (Omzet BTW)</CardTitle>
          <CardDescription>
            Alle facturen in deze periode - BTW bedrag: €{data.vatOverview.omzetBelasting.toLocaleString("nl-NL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Factuurnummer</TableHead>
                <TableHead>Totaal</TableHead>
                <TableHead>BTW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vatOverview.invoices.length > 0 ? (
                data.vatOverview.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {format(invoice.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>{invoice.number}</TableCell>
                    <TableCell>
                      €{Number(invoice.total).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      €{Number(invoice.vatTotal).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen facturen gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BTW per Categorie</CardTitle>
          <CardDescription>
            BTW bedragen opgesplitst per tariefcategorie voor de aangifte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Omzet BTW per categorie */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Omzet BTW (BTW te ontvangen)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BTW Tarief</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="default">{data.vatOverview.taxRules.standardRate}% (Hoog)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.omzetBelastingPerCategorie?.hoog.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">{data.vatOverview.taxRules.reducedRate}% (Laag)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.omzetBelastingPerCategorie?.laag.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">{data.vatOverview.taxRules.zeroRate}% (Nul)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.omzetBelastingPerCategorie?.nul.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Totaal Omzet BTW</TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.omzetBelasting.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Voorbelasting per categorie */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Voorbelasting (BTW te vorderen)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BTW Tarief</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="default">{data.vatOverview.taxRules.standardRate}% (Hoog)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.voorbelastingPerCategorie?.hoog.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">{data.vatOverview.taxRules.reducedRate}% (Laag)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.voorbelastingPerCategorie?.laag.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">{data.vatOverview.taxRules.zeroRate}% (Nul)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.voorbelastingPerCategorie?.nul.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Totaal Voorbelasting</TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.voorbelasting.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Te betalen BTW per categorie */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Te Betalen BTW (per categorie)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BTW Tarief</TableHead>
                    <TableHead className="text-right">Bedrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="default">{data.vatOverview.taxRules.standardRate}% (Hoog)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.teBetalenPerCategorie?.hoog.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="secondary">{data.vatOverview.taxRules.reducedRate}% (Laag)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.teBetalenPerCategorie?.laag.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">{data.vatOverview.taxRules.zeroRate}% (Nul)</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.teBetalenPerCategorie?.nul.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Totaal Te Betalen</TableCell>
                    <TableCell className="text-right">
                      €{data.vatOverview.teBetalen.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BTW Voorbelasting (BTW te vorderen)</CardTitle>
          <CardDescription>
            BTW boekingen op rekening 1510 - Voorbelasting: €{data.vatOverview.voorbelasting.toLocaleString("nl-NL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>BTW Bedrag</TableHead>
                <TableHead>BTW Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vatOverview.vatTeVorderenBookings && data.vatOverview.vatTeVorderenBookings.length > 0 ? (
                data.vatOverview.vatTeVorderenBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(booking.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>{booking.description}</TableCell>
                    <TableCell>
                      €{Number(booking.amount).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.vatCode || "Geen"}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen BTW voorbelasting boekingen gevonden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Nog niet geboekte documenten */}
      {(data.unbookedDocuments.length > 0 || data.unbookedInvoices.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Nog niet geboekte BTW Posten</CardTitle>
            <CardDescription>
              Documenten en facturen in deze periode die nog niet zijn geboekt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.unbookedDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Documenten ({data.unbookedDocuments.length})</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Bestandsnaam</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Actie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.unbookedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            {format(doc.createdAt, "d MMM yyyy", { locale: nl })}
                          </TableCell>
                          <TableCell>{doc.originalFilename}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.aiCategory || "Onbekend"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/documents/${doc.id}/book`}>
                              <Button variant="outline" size="sm">
                                Boeken
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {data.unbookedInvoices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Facturen ({data.unbookedInvoices.length})</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Factuurnummer</TableHead>
                        <TableHead>Klant</TableHead>
                        <TableHead>Totaal</TableHead>
                        <TableHead>BTW</TableHead>
                        <TableHead>Actie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.unbookedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            {format(invoice.date, "d MMM yyyy", { locale: nl })}
                          </TableCell>
                          <TableCell>{invoice.number}</TableCell>
                          <TableCell>
                            {invoice.customer?.name || "Onbekend"}
                          </TableCell>
                          <TableCell>
                            €{Number(invoice.total).toLocaleString("nl-NL", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            €{Number(invoice.vatTotal).toLocaleString("nl-NL", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Button variant="outline" size="sm">
                                Bekijken
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <BtwPeriodActions periodId={data.vatPeriod.id} status={data.vatPeriod.status} />
      </div>
    </div>
  );
}

