import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeEntriesClient } from "./TimeEntriesClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

async function getCompanyAndCustomers(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          customers: {
            orderBy: {
              name: "asc",
            },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  // Converteer Decimal naar number voor hourlyRate
  const customers = user.companies[0].customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    hourlyRate: customer.hourlyRate ? Number(customer.hourlyRate) : null,
  }));

  return {
    company: user.companies[0],
    customers,
  };
}

export default async function TimeEntriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Urenregistratie</h1>
        <p className="text-muted-foreground">Gebruiker niet gevonden</p>
      </div>
    );
  }

  const data = await getCompanyAndCustomers(user.id);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Urenregistratie</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Urenregistratie</h1>
        <p className="text-muted-foreground">
          Registreer uw gewerkte uren per dag en klant
        </p>
      </div>

      <TimeEntriesClient
        companyId={data.company.id}
        customers={data.customers}
      />
    </div>
  );
}







