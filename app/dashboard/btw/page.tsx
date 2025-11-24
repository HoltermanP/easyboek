import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateVatOverview } from "@/services/btw/btw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

async function getVatData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: {
        include: {
          vatPeriods: {
            orderBy: {
              endDate: "desc",
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
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);

  // Vind of maak BTW periode
  let vatPeriod = company.vatPeriods.find(
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

  const vatOverview = await calculateVatOverview(
    company.id,
    vatPeriod.startDate,
    vatPeriod.endDate
  );

  return {
    company,
    vatPeriod,
    vatOverview,
  };
}

export default async function BtwPage() {
  const user = await requireAuth();
  const data = await getVatData(user.clerkId);

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
          <CardTitle>Huidige BTW Periode</CardTitle>
          <CardDescription>
            {format(data.vatPeriod.startDate, "d MMMM", { locale: nl })} -{" "}
            {format(data.vatPeriod.endDate, "d MMMM yyyy", { locale: nl })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={data.vatPeriod.status === "open" ? "secondary" : "default"}>
                {data.vatPeriod.status === "open"
                  ? "Open"
                  : data.vatPeriod.status === "ready"
                  ? "Klaar voor aangifte"
                  : "Ingediend"}
              </Badge>
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

      <div className="flex justify-end">
        <Button
          disabled={data.vatPeriod.status !== "open"}
        >
          Markeer als klaar voor aangifte
        </Button>
      </div>
    </div>
  );
}

