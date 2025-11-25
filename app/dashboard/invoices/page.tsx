import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

export const dynamic = 'force-dynamic';

async function getInvoices(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          invoices: {
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

  return user.companies[0].invoices;
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Facturen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const invoices = await getInvoices(user.id);

  if (!invoices) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Facturen</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturen</h1>
          <p className="text-muted-foreground">
            Beheer uw uitgaande facturen
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Factuur
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturen Overzicht</CardTitle>
          <CardDescription>
            Alle facturen die u heeft aangemaakt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nummer</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>
                      {format(invoice.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {format(invoice.dueDate, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      €{Number(invoice.total).toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "overdue"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {invoice.status === "draft"
                          ? "Concept"
                          : invoice.status === "sent"
                          ? "Verzonden"
                          : invoice.status === "paid"
                          ? "Betaald"
                          : "Achterstallig"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          Bekijken
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nog geen facturen aangemaakt
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

