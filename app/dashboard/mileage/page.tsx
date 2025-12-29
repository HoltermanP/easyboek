import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, Trash2, Route } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { CreateMileageEntryDialog } from "@/components/mileage/CreateMileageEntryDialog";
import { DeleteMileageEntryButton } from "@/components/mileage/DeleteMileageEntryButton";
import { BookMileageEntriesButton } from "@/components/mileage/BookMileageEntriesButton";

export const dynamic = 'force-dynamic';

async function getMileageEntries(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          mileageEntries: {
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

  // Filter entries van dit jaar
  const entriesThisYear = company.mileageEntries.filter((e) => {
    const entryDate = new Date(e.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate >= startOfYear && entryDate <= endOfYear;
  });

  // Bereken totalen
  const totalKilometers = entriesThisYear.reduce((sum, e) => sum + Number(e.kilometers), 0);
  const totalAmount = entriesThisYear.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
  const bookedEntries = entriesThisYear.filter((e) => e.isBooked).length;

  return {
    company,
    entries: entriesThisYear,
    totalKilometers,
    totalAmount,
    bookedEntries,
    jaar: now.getFullYear(),
  };
}

export default async function MileagePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const data = await getMileageEntries(user.id);

  if (!data) {
    return (
      <div className="space-y-6 p-6">
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

  const { company, entries, totalKilometers, totalAmount, bookedEntries, jaar } = data;
  const unbookedCount = entries.length - bookedEntries;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kilometerregistratie</h1>
          <p className="text-muted-foreground">
            Registreer en beheer je zakelijke kilometers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unbookedCount > 0 && (
            <BookMileageEntriesButton
              companyId={company.id}
              unbookedCount={unbookedCount}
            />
          )}
          <CreateMileageEntryDialog companyId={company.id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Registraties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Kilometers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalKilometers.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Bedrag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totalAmount.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geboekt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookedEntries} / {entries.length}
            </div>
            <p className="text-xs text-muted-foreground">registraties</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kilometerregistraties {jaar}</CardTitle>
          <CardDescription>
            {entries.length} registratie{entries.length !== 1 ? "s" : ""} dit jaar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Route className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nog geen kilometerregistraties</p>
              <CreateMileageEntryDialog companyId={company.id} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kilometers</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Doel</TableHead>
                  <TableHead>Tarief</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(entry.date), "d MMM yyyy", { locale: nl })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(entry.kilometers).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} km
                    </TableCell>
                    <TableCell>
                      {entry.fromLocation || entry.toLocation ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {entry.fromLocation || "?"} → {entry.toLocation || "?"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.purpose ? (
                        <span className="text-sm">{entry.purpose}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        €{Number(entry.ratePerKm || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/km
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{Number(entry.totalAmount || 0).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {entry.isBooked ? (
                        <Badge variant="default">Geboekt</Badge>
                      ) : (
                        <Badge variant="outline">Niet geboekt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!entry.isBooked && (
                        <DeleteMileageEntryButton
                          entryId={entry.id}
                          companyId={company.id}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

