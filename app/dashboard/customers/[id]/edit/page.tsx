import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditCustomerForm } from "@/components/customers/EditCustomerForm";

export const dynamic = 'force-dynamic';

async function getCustomer(customerId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          customers: {
            where: { id: customerId },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  const customer = user.companies[0].customers[0];
  if (!customer) {
    return null;
  }

  return {
    customer,
    company: user.companies[0],
  };
}

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dashboard/customers");
  }
  const data = await getCustomer(params.id, user.id);

  if (!data) {
    redirect("/dashboard/customers");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Klant Bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk de gegevens van {data.customer.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klantgegevens</CardTitle>
          <CardDescription>
            Wijzig de gegevens van de klant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditCustomerForm customer={data.customer} />
        </CardContent>
      </Card>
    </div>
  );
}

