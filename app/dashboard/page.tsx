import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { LedgerAccountCode } from "@/components/ledger/LedgerAccountCode";
import { InvoiceNotifications } from "@/components/dashboard/InvoiceNotifications";

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
  
  // Alle kosten boekingen (voor debug)
  const allCostBookings = company.bookings.filter((b) => b.debitAccount.code.startsWith("4"));
  const allCosts = allCostBookings.reduce((sum, b) => sum + Number(b.amount), 0);

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
    allCostBookings,
    allCosts,
    kostenBookingsThisMonth,
    kostenBookingsThisYear,
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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overzicht van {data.company.name}
        </p>
      </div>

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
                {data.company.bookings.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Totaal boekingen: {data.company.bookings.length}</p>
                    <p>Kosten boekingen dit jaar: {data.kostenBookingsThisYear.length}</p>
                    <p>Kosten boekingen deze maand: {data.kostenBookingsThisMonth.length}</p>
                    <p>Alle kosten boekingen: {data.allCostBookings.length} (totaal: €{data.allCosts.toLocaleString("nl-NL", { minimumFractionDigits: 2 })})</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug info - kan later worden verwijderd */}
      {process.env.NODE_ENV === "development" && (() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <p>Huidige maand: {format(startOfMonth, "d MMM", { locale: nl })} - {format(endOfMonth, "d MMM yyyy", { locale: nl })}</p>
                <p>Huidig jaar: {format(startOfYear, "d MMM yyyy", { locale: nl })} - {format(endOfYear, "d MMM yyyy", { locale: nl })}</p>
                <p>Totaal boekingen: {data.company.bookings.length}</p>
                <p>Kosten boekingen dit jaar: {data.kostenBookingsThisYear.length}</p>
                <p>Kosten boekingen deze maand: {data.kostenBookingsThisMonth.length}</p>
                <p>Alle kosten boekingen: {data.allCostBookings.length} (totaal: €{data.allCosts.toLocaleString("nl-NL", { minimumFractionDigits: 2 })})</p>
                {data.company.bookings.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Laatste 3 boekingen:</p>
                    {data.company.bookings.slice(0, 3).map((b) => {
                      const bookingDate = new Date(b.date);
                      bookingDate.setHours(0, 0, 0, 0);
                      const isInMonth = bookingDate >= startOfMonth && bookingDate <= endOfMonth;
                      const isInYear = bookingDate >= startOfYear && bookingDate <= endOfYear;
                      
                      return (
                        <div key={b.id} className="border-l-2 pl-2 mb-2">
                          <p>Datum: {format(b.date, "d MMM yyyy", { locale: nl })}</p>
                          <p>
                            Debet: <LedgerAccountCode code={b.debitAccount.code} name={b.debitAccount.name} />
                          </p>
                          <p>
                            Credit: <LedgerAccountCode code={b.creditAccount.code} name={b.creditAccount.name} />
                          </p>
                          <p>Bedrag: €{Number(b.amount).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</p>
                          <p>Is kosten: {b.debitAccount.code.startsWith("4") ? "Ja" : "Nee"}</p>
                          <p>In deze maand: {isInMonth ? "Ja" : "Nee"}</p>
                          <p>In dit jaar: {isInYear ? "Ja" : "Nee"}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
  } catch (error) {
    console.error("Error in DashboardPage:", error);
    // Re-throw zodat de error boundary het kan afhandelen
    throw error;
  }
}

