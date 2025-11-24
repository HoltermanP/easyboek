import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkInvoicePaidButton } from "@/components/invoices/MarkInvoicePaidButton";

async function getInvoice(invoiceId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: true,
    },
  });

  if (!user) {
    return null;
  }

  const companyIds = user.companies.map((c) => c.id);

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId: {
        in: companyIds,
      },
    },
    include: {
      company: true,
      customer: true,
    },
  });

  return invoice;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const invoice = await getInvoice(params.id, user.clerkId);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Factuur niet gevonden</h1>
        <Card>
          <CardHeader>
            <CardTitle>Fout</CardTitle>
            <CardDescription>De gevraagde factuur kon niet worden gevonden.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug naar facturen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = invoice.items as Array<{
    description: string;
    quantity: number;
    price: number;
    vat: number;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-4">Factuur {invoice.number}</h1>
        </div>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Factuurgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Factuurnummer:</span>
              <p className="font-medium">{invoice.number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Datum:</span>
              <p className="font-medium">
                {format(invoice.date, "d MMMM yyyy", { locale: nl })}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Vervaldatum:</span>
              <p className="font-medium">
                {format(invoice.dueDate, "d MMMM yyyy", { locale: nl })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Naam:</span>
              <p className="font-medium">{invoice.customer.name}</p>
            </div>
            {invoice.customer.email && (
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{invoice.customer.email}</p>
              </div>
            )}
            {invoice.customer.address && (
              <div>
                <span className="text-sm text-muted-foreground">Adres:</span>
                <p className="font-medium">{invoice.customer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factuurregels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Aantal</TableHead>
                <TableHead>Prijs</TableHead>
                <TableHead>BTW %</TableHead>
                <TableHead className="text-right">Totaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const subtotal = item.quantity * item.price;
                const vatAmount = subtotal * (item.vat / 100);
                const total = subtotal + vatAmount;

                return (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      €{item.price.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{item.vat}%</TableCell>
                    <TableCell className="text-right">
                      €{total.toLocaleString("nl-NL", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 text-right">
            <div className="flex justify-end gap-4">
              <span className="text-muted-foreground">Subtotaal:</span>
              <span className="w-32 text-right">
                €{(Number(invoice.total) - Number(invoice.vatTotal)).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-muted-foreground">BTW:</span>
              <span className="w-32 text-right">
                €{Number(invoice.vatTotal).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-end gap-4 pt-2 border-t text-lg font-bold">
              <span>Totaal:</span>
              <span className="w-32 text-right">
                €{Number(invoice.total).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.status !== "paid" && (
        <Card>
          <CardHeader>
            <CardTitle>Factuur Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkInvoicePaidButton invoiceId={invoice.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}



