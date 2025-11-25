import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateInvoiceForm } from "@/components/invoices/CreateInvoiceForm";
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
          invoices: {
            orderBy: {
              createdAt: "desc",
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
  const lastInvoice = company.invoices[0];
  
  // Genereer volgend factuurnummer
  let nextNumber = "FAC-001";
  if (lastInvoice) {
    const match = lastInvoice.number.match(/FAC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      nextNumber = `FAC-${num.toString().padStart(3, "0")}`;
    }
  }

  return {
    company,
    customers: company.customers,
    nextInvoiceNumber: nextNumber,
  };
}

export default async function NewInvoicePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nieuwe Factuur</h1>
        <p className="text-muted-foreground">Gebruiker niet gevonden</p>
      </div>
    );
  }
  const data = await getCompanyAndCustomers(user.id);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nieuwe Factuur</h1>
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
        <h1 className="text-3xl font-bold">Nieuwe Factuur</h1>
        <p className="text-muted-foreground">
          Maak een nieuwe factuur aan
        </p>
      </div>

      <CreateInvoiceForm
        companyId={data.company.id}
        customers={data.customers}
        defaultInvoiceNumber={data.nextInvoiceNumber}
      />
    </div>
  );
}

