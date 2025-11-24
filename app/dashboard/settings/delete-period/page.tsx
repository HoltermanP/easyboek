import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletePeriodForm } from "@/components/settings/DeletePeriodForm";

async function getCompanyData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: {
        orderBy: {
          year: "desc",
        },
      },
    },
  });

  return user?.companies || [];
}

export default async function DeletePeriodPage() {
  const user = await requireAuth();
  const companies = await getCompanyData(user.clerkId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Verwijder Periode Data</h1>
        <p className="text-muted-foreground">
          Verwijder alle boekingen, facturen en documenten binnen een bepaalde periode
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waarschuwing</CardTitle>
          <CardDescription>
            Deze actie kan niet ongedaan worden gemaakt. Alle boekingen, facturen en documenten binnen de geselecteerde periode worden permanent verwijderd.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeletePeriodForm companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}

