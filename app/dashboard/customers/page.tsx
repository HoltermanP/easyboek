import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, MapPin, Building2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { CreateCustomerDialog } from "@/components/customers/CreateCustomerDialog";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

export const dynamic = 'force-dynamic';

async function getCustomers(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          customers: {
            orderBy: {
              name: "asc",
            },
            include: {
              invoices: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  return {
    company: user.companies[0],
    customers: user.companies[0].customers,
  };
}

export default async function CustomersPage() {
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
  const data = await getCustomers(user.id);

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

  const { company, customers } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klanten</h1>
          <p className="text-muted-foreground">
            Beheer je klanten en hun gegevens
          </p>
        </div>
        <CreateCustomerDialog companyId={company.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Klanten</CardTitle>
          <CardDescription>
            {customers.length} klant{customers.length !== 1 ? "en" : ""} totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nog geen klanten aangemaakt</p>
              <CreateCustomerDialog companyId={company.id} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adres</TableHead>
                  <TableHead>Bedrijfsgegevens</TableHead>
                  <TableHead>Facturen</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.address || customer.city ? (
                        <div className="space-y-1 text-sm">
                          {customer.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                          {(customer.postalCode || customer.city) && (
                            <div className="text-muted-foreground">
                              {customer.postalCode} {customer.city}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {customer.kvkNumber && (
                          <div>KVK: {customer.kvkNumber}</div>
                        )}
                        {customer.btwNumber && (
                          <div>BTW: {customer.btwNumber}</div>
                        )}
                        {!customer.kvkNumber && !customer.btwNumber && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.invoices.length} factuur{customer.invoices.length !== 1 ? "en" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(customer.createdAt), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/dashboard/customers/${customer.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteCustomerButton
                          customerId={customer.id}
                          customerName={customer.name}
                          hasInvoices={customer.invoices.length > 0}
                        />
                      </div>
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

