import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { LedgerAccountCode } from "@/components/ledger/LedgerAccountCode";
import { InvoiceNotifications } from "@/components/dashboard/InvoiceNotifications";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { getOverdueInvoices, getUpcomingDueInvoices, getTotalOutstanding } from "@/services/notifications/invoices";
import { calculateMonthlyReservationAdvice, calculateQuarterlyReservationAdvice } from "@/services/tax/reservationAdvice";
import { calculateProfitAndLoss } from "@/services/reports/reports";
import { AlertTriangle, TrendingUp, TrendingDown, Info, DollarSign, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReservationAdvice } from "@/components/dashboard/ReservationAdvice";
import { QuarterlyVatAdvice } from "@/components/dashboard/QuarterlyVatAdvice";
import { FinancialAdvice } from "@/components/dashboard/FinancialAdvice";

export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: {
          include: {
            bookings: {
              include: {
                debitAccount: true,
                creditAccount: true,
              },
            },
            invoices: {
              include: {
                customer: true,
              },
            },
            documents: true,
            vatPeriods: {
              where: {
                status: "open",
              },
              orderBy: {
                endDate: "desc",
              },
              take: 1,
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
  
  // Huidige maand voor maandelijkse statistieken
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  // Hele jaar voor jaarlijkse statistieken
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  // Bereken omzet deze maand (credit op 8xxx rekeningen)
  const omzetBookingsThisMonth = company.bookings.filter(
    (b) => b.creditAccount.code.startsWith("8") && b.date >= startOfMonth && b.date <= endOfMonth
  );
  const omzetThisMonth = omzetBookingsThisMonth.reduce((sum, b) => sum + Number(b.amount), 0);
  
  // Bereken omzet hele jaar
  const omzetBookingsThisYear = company.bookings.filter(
    (b) => b.creditAccount.code.startsWith("8") && b.date >= startOfYear && b.date <= endOfYear
  );
  const omzetThisYear = omzetBookingsThisYear.reduce((sum, b) => sum + Number(b.amount), 0);

  // Bereken kosten deze maand (debet op 4xxx rekeningen)
  const kostenBookingsThisMonth = company.bookings.filter((b) => {
    const debitCode = b.debitAccount.code;
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    const isCostAccount = debitCode.startsWith("4");
    const isInCurrentMonth = bookingDate >= startOfMonth && bookingDate <= endOfMonth;
    return isCostAccount && isInCurrentMonth;
  });
  const kostenThisMonth = kostenBookingsThisMonth.reduce((sum, b) => sum + Number(b.amount), 0);
  
  // Bereken kosten hele jaar
  const kostenBookingsThisYear = company.bookings.filter((b) => {
    const debitCode = b.debitAccount.code;
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    const isCostAccount = debitCode.startsWith("4");
    const isInCurrentYear = bookingDate >= startOfYear && bookingDate <= endOfYear;
    return isCostAccount && isInCurrentYear;
  });
  const kostenThisYear = kostenBookingsThisYear.reduce((sum, b) => sum + Number(b.amount), 0);

  // Verwachte opbrengsten (openstaande facturen)
  const outstandingInvoices = company.invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "draft"
  );
  const expectedRevenue = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  // Betaalde facturen deze maand (voor reserveringsadvies)
  const paidInvoicesThisMonth = company.invoices.filter(
    (inv) => inv.status === "paid" && 
    new Date(inv.date) >= startOfMonth && 
    new Date(inv.date) <= endOfMonth
  );

  // Haal aandachtspunten op
  const [overdueInvoices, upcomingInvoices, outstanding] = await Promise.all([
    getOverdueInvoices(company.id),
    getUpcomingDueInvoices(company.id, 7),
    getTotalOutstanding(company.id),
  ]);

  // Reserveringsadvies (maandelijks)
  let reservationAdvice = null;
  try {
    reservationAdvice = await calculateMonthlyReservationAdvice(company.id);
  } catch (error) {
    console.error("Error calculating reservation advice:", error);
  }

  // Kwartaalgebaseerd BTW reserveringsadvies
  let quarterlyVatAdvice = null;
  try {
    quarterlyVatAdvice = await calculateQuarterlyReservationAdvice(company.id);
  } catch (error) {
    console.error("Error calculating quarterly VAT advice:", error);
  }

  // Bereken winst voor adviezen
  let profitThisYear = 0;
  try {
    const pnl = await calculateProfitAndLoss(company.id, startOfYear, endOfYear);
    profitThisYear = pnl.profit.total;
  } catch (error) {
    console.error("Error calculating profit:", error);
  }

  // Top 5 kosten dit jaar
  const kostenPerRekening = kostenBookingsThisYear.reduce((acc, b) => {
    const code = b.debitAccount.code;
    acc[code] = (acc[code] || 0) + Number(b.amount);
    return acc;
  }, {} as Record<string, number>);

  const top5Kosten = Object.entries(kostenPerRekening)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([code, amount]) => ({
      code,
      amount,
      name: kostenBookingsThisYear.find((b) => b.debitAccount.code === code)?.debitAccount.name || code,
    }));

  return {
    company,
    omzetThisMonth,
    omzetThisYear,
    kostenThisMonth,
    kostenThisYear,
    top5Kosten,
    openVatPeriod: company.vatPeriods[0] || null,
    totalDocuments: company.documents.length,
    expectedRevenue,
    outstandingInvoices: outstandingInvoices.length,
    overdueInvoices,
    upcomingInvoices,
    outstanding,
    reservationAdvice,
    quarterlyVatAdvice,
    paidInvoicesThisMonth: paidInvoicesThisMonth.length,
    profitThisYear,
  };
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    // Return null zodat de UI een vriendelijke melding kan tonen
    return null;
  }
}

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Card>
            <CardHeader>
              <CardTitle>Geen gebruiker gevonden</CardTitle>
              <CardDescription>
                Er is een probleem opgetreden.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
    const data = await getDashboardData(user.id);

    if (!data) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Card>
            <CardHeader>
              <CardTitle>Geen bedrijf gevonden</CardTitle>
              <CardDescription>
                Maak eerst een bedrijf aan om te beginnen.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <SubscriptionBanner />
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overzicht van {data.company.name}
        </p>
      </div>

      {/* Kosten en Opbrengsten - Prominent */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Kosten deze maand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              €{data.kostenThisMonth.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Totaal dit jaar: €{data.kostenThisYear.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Verwachte opbrengsten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              €{data.expectedRevenue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.outstandingInvoices} openstaande factuur{data.outstandingInvoices !== 1 ? "en" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aandachtspunten */}
      {(data.overdueInvoices.length > 0 || data.upcomingInvoices.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Aandachtspunten
            </CardTitle>
            <CardDescription>
              Belangrijke items die uw aandacht vereisen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdueInvoices.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Vervallen Facturen</AlertTitle>
                <AlertDescription>
                  U heeft {data.overdueInvoices.length} vervallen factuur{data.overdueInvoices.length !== 1 ? "en" : ""} met een totaal bedrag van{" "}
                  €{data.overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </AlertDescription>
              </Alert>
            )}
            {data.upcomingInvoices.length > 0 && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>Facturen Vervallen Binnenkort</AlertTitle>
                <AlertDescription>
                  {data.upcomingInvoices.length} factuur{data.upcomingInvoices.length !== 1 ? "en" : ""} vervalt binnen 7 dagen
                </AlertDescription>
              </Alert>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/invoices">Bekijk Alle Facturen</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kwartaalgebaseerd BTW Reserveringsadvies */}
      {data.quarterlyVatAdvice && (
        <QuarterlyVatAdvice advice={data.quarterlyVatAdvice} />
      )}

      {/* Maandelijks reserveringsadvies - alleen tonen bij betaalde facturen */}
      {data.reservationAdvice && data.paidInvoicesThisMonth > 0 && (
        <ReservationAdvice 
          advice={data.reservationAdvice} 
          paidInvoicesThisMonth={data.paidInvoicesThisMonth}
        />
      )}

      {/* Financiële adviezen */}
      <FinancialAdvice
        hasOverdueInvoices={data.overdueInvoices.length > 0}
        hasUpcomingInvoices={data.upcomingInvoices.length > 0}
        outstandingAmount={data.outstanding.total}
        profitThisYear={data.profitThisYear}
        hasOpenVatPeriod={!!data.openVatPeriod}
      />

      {/* Overige statistieken */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omzet dit jaar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.omzetThisYear.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deze maand: €{data.omzetThisMonth.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kosten dit jaar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{data.kostenThisYear.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deze maand: €{data.kostenThisMonth.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTW Periode</CardTitle>
          </CardHeader>
          <CardContent>
            {data.openVatPeriod ? (
              <div className="space-y-1">
                <div className="text-sm">
                  {format(data.openVatPeriod.startDate, "d MMM", { locale: nl })} -{" "}
                  {format(data.openVatPeriod.endDate, "d MMM yyyy", { locale: nl })}
                </div>
                <Badge variant="outline">{data.openVatPeriod.status}</Badge>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Geen open periode</div>
            )}
          </CardContent>
        </Card>
      </div>

      <InvoiceNotifications companyId={data.company.id} />

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Kosten</CardTitle>
          <CardDescription>Meest gebruikte kostenrekeningen dit jaar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.top5Kosten.length > 0 ? (
              data.top5Kosten.map((item) => (
                <div key={item.code} className="flex items-center justify-between">
                  <div>
                    <LedgerAccountCode code={item.code} name={item.name} className="text-sm" />
                  </div>
                  <div className="font-semibold">
                    €{item.amount.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Geen kosten dit jaar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
  } catch (error) {
    console.error("Error in DashboardPage:", error);
    // Re-throw zodat de error boundary het kan afhandelen
    throw error;
  }
}

