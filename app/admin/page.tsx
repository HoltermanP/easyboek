import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

async function getAdminData() {
  const companies = await prisma.company.findMany({
    include: {
      owner: true,
      _count: {
        select: {
          bookings: true,
          documents: true,
          invoices: true,
        },
      },
      vatPeriods: {
        where: {
          status: "open",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const documentsWithoutBooking = await prisma.transactionDocument.findMany({
    where: {
      status: {
        not: "booked",
      },
    },
    include: {
      company: true,
    },
  });

  return {
    companies,
    documentsWithoutBooking,
  };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Toegang Geweigerd</h1>
        <p className="text-muted-foreground">Je hebt geen toegang tot deze pagina.</p>
      </div>
    );
  }
  const data = await getAdminData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Beheer alle administraties en bedrijven
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Totaal Bedrijven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Open BTW Perioden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.companies.reduce((sum, c) => sum + c.vatPeriods.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documenten Zonder Boeking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.documentsWithoutBooking.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Bedrijven</CardTitle>
          <CardDescription>Overzicht van alle geregistreerde bedrijven</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Eigenaar</TableHead>
                <TableHead>KVK</TableHead>
                <TableHead>BTW Nummer</TableHead>
                <TableHead>Boekingen</TableHead>
                <TableHead>Documenten</TableHead>
                <TableHead>Facturen</TableHead>
                <TableHead>Open BTW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.owner.email || company.owner.name || "-"}</TableCell>
                  <TableCell>{company.kvkNumber || "-"}</TableCell>
                  <TableCell>{company.btwNumber || "-"}</TableCell>
                  <TableCell>{company._count.bookings}</TableCell>
                  <TableCell>{company._count.documents}</TableCell>
                  <TableCell>{company._count.invoices}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {company.vatPeriods.length} open
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documenten Zonder Boeking</CardTitle>
          <CardDescription>
            Documenten die nog niet zijn geboekt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Bestand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.documentsWithoutBooking.length > 0 ? (
                data.documentsWithoutBooking.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.company.name}</TableCell>
                    <TableCell>{doc.originalFilename}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === "booked"
                            ? "default"
                            : doc.status === "processed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(doc.createdAt, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Alle documenten zijn geboekt
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

