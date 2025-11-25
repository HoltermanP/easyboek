import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import Link from "next/link";
import { Eye, Download } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getDocuments(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          documents: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  return user.companies[0].documents;
}

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Documenten</h1>
        <p className="text-muted-foreground">Gebruiker niet gevonden</p>
      </div>
    );
  }
  const documents = await getDocuments(user.id);

  if (!documents) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Documenten</h1>
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
        <h1 className="text-3xl font-bold">Documenten Overzicht</h1>
        <p className="text-muted-foreground">
          Alle geüploade documenten en hun verwerkingsstatus
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geüploade Documenten</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? "en" : ""} totaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bestandsnaam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.originalFilename}</TableCell>
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
                        {doc.status === "uploaded"
                          ? "Geüpload"
                          : doc.status === "processed"
                          ? "Verwerkt"
                          : doc.status === "booked"
                          ? "Geboekt"
                          : "Onbekend"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.aiCategory ? (
                        <Badge variant="secondary">{doc.aiCategory}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(doc.createdAt, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            Bekijk
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} download>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                        {doc.status !== "booked" && (
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/dashboard/documents/${doc.id}/book`}>
                              Boek
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nog geen documenten geüpload
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {documents.some((doc) => doc.ocrText) && (
        <Card>
          <CardHeader>
            <CardTitle>OCR Resultaten</CardTitle>
            <CardDescription>
              Tekst extractie van documenten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents
                .filter((doc) => doc.ocrText)
                .map((doc) => (
                  <div key={doc.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{doc.originalFilename}</span>
                      {doc.aiCategory && (
                        <Badge variant="secondary">{doc.aiCategory}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {doc.ocrText}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

