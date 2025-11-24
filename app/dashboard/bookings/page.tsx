import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { LedgerAccountCode } from "@/components/ledger/LedgerAccountCode";

async function getBookings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: {
        include: {
          bookings: {
            include: {
              debitAccount: true,
              creditAccount: true,
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
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  // Filter boekingen van dit jaar
  const bookingsThisYear = company.bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= startOfYear && bookingDate <= endOfYear;
  });

  // Bereken totalen
  const kostenBookings = bookingsThisYear.filter((b) => b.debitAccount.code.startsWith("4"));
  const omzetBookings = bookingsThisYear.filter((b) => b.creditAccount.code.startsWith("8"));
  
  const totaalKosten = kostenBookings.reduce((sum, b) => sum + Number(b.amount), 0);
  const totaalOmzet = omzetBookings.reduce((sum, b) => sum + Number(b.amount), 0);

  return {
    bookings: bookingsThisYear,
    totaalKosten,
    totaalOmzet,
    jaar: now.getFullYear(),
  };
}

export default async function BookingsPage() {
  const user = await requireAuth();
  const data = await getBookings(user.clerkId);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Boekingen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen bedrijf gevonden</CardTitle>
            <CardDescription>
              Maak eerst een bedrijf aan in de instellingen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { bookings, totaalKosten, totaalOmzet, jaar } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Boekingen Overzicht</h1>
        <p className="text-muted-foreground">
          Alle boekingen van {jaar} in het grootboek
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Boekingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Kosten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              €{totaalKosten.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Omzet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totaalOmzet.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grootboek Boekingen {jaar}</CardTitle>
          <CardDescription>
            {bookings.length} boeking{bookings.length !== 1 ? "en" : ""} dit jaar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Debet</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>BTW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(booking.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="font-medium">{booking.description}</TableCell>
                    <TableCell>
                      <LedgerAccountCode
                        code={booking.debitAccount.code}
                        name={booking.debitAccount.name}
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <LedgerAccountCode
                        code={booking.creditAccount.code}
                        name={booking.creditAccount.name}
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{Number(booking.amount).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {booking.vatCode ? (
                        <Badge variant="outline">{booking.vatCode}%</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nog geen boekingen
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

