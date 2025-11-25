import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STANDARD_LEDGER_ACCOUNTS } from "@/lib/ledgerAccounts";
import { LedgerAccountCode } from "@/components/ledger/LedgerAccountCode";

async function getLedgerAccounts(userId: string) {
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

  return {
    company: user.companies[0],
    standardAccounts: STANDARD_LEDGER_ACCOUNTS,
  };
}

export default async function LedgerAccountsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Grootboekrekeningen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const data = await getLedgerAccounts(user.id);

  if (!data) {
    return (
      <div className="p-6">
        <p>Geen bedrijf gevonden. Maak eerst een bedrijf aan in de instellingen.</p>
      </div>
    );
  }

  const { company, standardAccounts } = data;
  
  // Groepeer rekeningen per categorie
  const accountsByCategory = {
    activa: standardAccounts.filter((a: any) => a.category === "activa"),
    passiva: standardAccounts.filter((a: any) => a.category === "passiva"),
    kosten: standardAccounts.filter(a => a.category === "kosten"),
    opbrengsten: standardAccounts.filter(a => a.category === "opbrengsten"),
  };

  // Check welke rekeningen al bestaan
  const existingCodes = new Set(company.ledgerAccounts.map(acc => acc.code));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Grootboekrekeningen</h1>
        <p className="text-muted-foreground">
          Overzicht van alle beschikbare grootboekrekeningen
        </p>
      </div>

      {/* Activa */}
      <Card>
        <CardHeader>
          <CardTitle>Activa (0xxx-1xxx)</CardTitle>
          <CardDescription>Vaste en vlottende activa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beschrijving</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsByCategory.activa.map((acc) => (
                <TableRow key={acc.code}>
                  <TableCell>
                    <LedgerAccountCode code={acc.code} name={acc.name} />
                  </TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {existingCodes.has(acc.code) ? (
                      <Badge variant="default">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Niet aangemaakt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Passiva */}
      <Card>
        <CardHeader>
          <CardTitle>Passiva (2xxx-3xxx)</CardTitle>
          <CardDescription>Eigen vermogen en vreemd vermogen</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beschrijving</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsByCategory.passiva.map((acc) => (
                <TableRow key={acc.code}>
                  <TableCell>
                    <LedgerAccountCode code={acc.code} name={acc.name} />
                  </TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {existingCodes.has(acc.code) ? (
                      <Badge variant="default">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Niet aangemaakt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Kosten */}
      <Card>
        <CardHeader>
          <CardTitle>Kosten (4xxx-6xxx)</CardTitle>
          <CardDescription>Bedrijfskosten - belangrijk voor AI categorisatie</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keywords (AI)</TableHead>
                <TableHead>Beschrijving</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsByCategory.kosten.map((acc) => (
                <TableRow key={acc.code}>
                  <TableCell>
                    <LedgerAccountCode code={acc.code} name={acc.name} />
                  </TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {existingCodes.has(acc.code) ? (
                      <Badge variant="default">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Niet aangemaakt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.keywords ? acc.keywords.slice(0, 3).join(", ") + (acc.keywords.length > 3 ? "..." : "") : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Opbrengsten */}
      <Card>
        <CardHeader>
          <CardTitle>Opbrengsten (8xxx)</CardTitle>
          <CardDescription>Omzet en inkomsten</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keywords (AI)</TableHead>
                <TableHead>Beschrijving</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsByCategory.opbrengsten.map((acc) => (
                <TableRow key={acc.code}>
                  <TableCell>
                    <LedgerAccountCode code={acc.code} name={acc.name} />
                  </TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {existingCodes.has(acc.code) ? (
                      <Badge variant="default">Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Niet aangemaakt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.keywords ? acc.keywords.slice(0, 3).join(", ") + (acc.keywords.length > 3 ? "..." : "") : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acc.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

