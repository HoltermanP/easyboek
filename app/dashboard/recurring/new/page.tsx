import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRecurringBookingForm } from "@/components/recurring/CreateRecurringBookingForm";

export const dynamic = 'force-dynamic';

async function getCompanyAndAccounts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          ledgerAccounts: {
            orderBy: {
              code: "asc",
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
  const costAccounts = company.ledgerAccounts.filter(
    (acc) => acc.code.startsWith("4")
  );
  const bankAccounts = company.ledgerAccounts.filter(
    (acc) => acc.code === "1000" || acc.code === "1010"
  );

  return {
    company,
    costAccounts,
    bankAccounts,
  };
}

export default async function NewRecurringBookingPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nieuwe Herhalende Boeking</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
            <CardDescription>
              Er is een probleem opgetreden.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const data = await getCompanyAndAccounts(user.id);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nieuwe Herhalende Boeking</h1>
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
        <h1 className="text-3xl font-bold">Nieuwe Herhalende Boeking</h1>
        <p className="text-muted-foreground">
          Maak een automatische herhalende boeking aan
        </p>
      </div>

      <CreateRecurringBookingForm
        companyId={data.company.id}
        costAccounts={data.costAccounts}
        bankAccounts={data.bankAccounts}
        userId={user!.id}
      />
    </div>
  );
}

