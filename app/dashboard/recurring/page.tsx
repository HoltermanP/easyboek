import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Play, Pause, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { getRecurringBookings } from "@/services/recurring/processRecurring";
import { ToggleRecurringButton } from "@/components/recurring/ToggleRecurringButton";
import { DeleteRecurringButton } from "@/components/recurring/DeleteRecurringButton";

export const dynamic = 'force-dynamic';

async function getCompany(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: true,
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  return user.companies[0];
}

export default async function RecurringBookingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Herhalende Boekingen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const company = await getCompany(user.id);

  if (!company) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Herhalende Boekingen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen bedrijf gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const recurringBookings = await getRecurringBookings(company.id);

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Maandelijks";
      case "quarterly":
        return "Per kwartaal";
      case "yearly":
        return "Jaarlijks";
      default:
        return frequency;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Herhalende Boekingen</h1>
          <p className="text-muted-foreground">
            Automatische boekingen die periodiek worden aangemaakt
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recurring/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Herhalende Boeking
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Herhalende Boekingen</CardTitle>
          <CardDescription>
            {recurringBookings.length} herhalende boeking
            {recurringBookings.length !== 1 ? "en" : ""} totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Frequentie</TableHead>
                <TableHead>Dag</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Rekeningen</TableHead>
                <TableHead>Laatste Verwerking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringBookings.length > 0 ? (
                recurringBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.description}
                    </TableCell>
                    <TableCell>{getFrequencyLabel(booking.frequency)}</TableCell>
                    <TableCell>{booking.dayOfMonth}</TableCell>
                    <TableCell>{formatCurrency(Number(booking.amount))}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          <span className="font-mono">{booking.debitAccount.code}</span>{" "}
                          {booking.debitAccount.name}
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-mono">{booking.creditAccount.code}</span>{" "}
                          {booking.creditAccount.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.lastProcessed ? (
                        format(booking.lastProcessed, "d MMM yyyy", { locale: nl })
                      ) : (
                        <span className="text-muted-foreground">Nog niet verwerkt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.isActive ? "default" : "secondary"}>
                        {booking.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ToggleRecurringButton
                          id={booking.id}
                          isActive={booking.isActive}
                        />
                        <DeleteRecurringButton id={booking.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nog geen herhalende boekingen aangemaakt
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

