import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MobileDashboard } from "./MobileDashboard";

export const dynamic = 'force-dynamic';

async function getMobileData(userId: string) {
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

export default async function MobilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Niet ingelogd</h1>
          <p className="text-muted-foreground">Log in om de mobiele app te gebruiken</p>
        </div>
      </div>
    );
  }

  const data = await getMobileData(user.id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Geen bedrijf gevonden</h1>
          <p className="text-muted-foreground">Maak eerst een bedrijf aan</p>
        </div>
      </div>
    );
  }

  return <MobileDashboard companyId={data.company.id} customers={data.customers} />;
}

