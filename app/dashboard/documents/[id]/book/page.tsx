import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction } from "./actions";

export const dynamic = 'force-dynamic';

async function getDocument(documentId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          documents: {
            where: { id: documentId },
          },
          ledgerAccounts: {
            where: {
              code: {
                startsWith: "4", // Alleen kostenrekeningen
              },
            },
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
  const document = company.documents[0];

  if (!document) {
    return null;
  }

  // Find bank account
  const bankAccount = await prisma.ledgerAccount.findFirst({
    where: {
      companyId: company.id,
      code: "1000",
    },
  });

  return {
    document,
    company,
    costAccounts: company.ledgerAccounts,
    bankAccount,
  };
}

export default async function BookDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dashboard/documents");
  }
  const data = await getDocument(params.id, user.id);

  if (!data) {
    redirect("/dashboard/documents");
  }

  const { document, company, costAccounts, bankAccount } = data;

  // Extract amount from OCR if available
  let suggestedAmount = 0;
  if (document.ocrText) {
    const amountPatterns = [
      /€\s*(\d+[.,]\d{2})/,
      /EUR\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*€/,
      /Totaal[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /Bedrag[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /(\d+[.,]\d{2})/,
    ];

    for (const pattern of amountPatterns) {
      const match = document.ocrText.match(pattern);
      if (match) {
        const foundAmount = parseFloat(match[1].replace(",", "."));
        if (foundAmount > suggestedAmount) {
          suggestedAmount = foundAmount;
        }
      }
    }
  }

  // Find suggested account based on category
  let suggestedAccountId = costAccounts[0]?.id || "";
  if (document.aiCategory) {
    const categoryAccount = costAccounts.find(
      (acc) => acc.code === "4500" || acc.code === "4600" || acc.code === "4690"
    );
    if (categoryAccount) {
      suggestedAccountId = categoryAccount.id;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Boeking Aanmaken</h1>
        <p className="text-muted-foreground">
          Maak een boeking aan voor: {document.originalFilename}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Bestandsnaam:</span>
            <p className="font-medium">{document.originalFilename}</p>
          </div>
          {document.aiCategory && (
            <div>
              <span className="text-sm text-muted-foreground">Categorie:</span>
              <p className="font-medium">{document.aiCategory}</p>
            </div>
          )}
          {document.ocrText && (
            <div>
              <span className="text-sm text-muted-foreground">OCR Tekst:</span>
              <p className="text-sm mt-1 p-2 bg-muted rounded">{document.ocrText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boeking Details</CardTitle>
          <CardDescription>
            Vul de gegevens in om een boeking aan te maken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createBookingAction} className="space-y-4">
            <input type="hidden" name="documentId" value={document.id} />
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="bankAccountId" value={bankAccount?.id || ""} />

            <div className="space-y-2">
              <Label htmlFor="debitAccount">Kosten Rekening</Label>
              <select
                id="debitAccount"
                name="debitAccountId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
                defaultValue={suggestedAccountId}
              >
                {costAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Bedrag</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={suggestedAmount > 0 ? suggestedAmount : ""}
                placeholder="0.00"
              />
              {suggestedAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Voorgesteld bedrag uit OCR: €{suggestedAmount.toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                name="description"
                defaultValue={`${document.aiCategory || "Kosten"} - ${document.originalFilename}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date(document.createdAt).toISOString().split("T")[0]}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Boeking Aanmaken</Button>
              <Button type="button" variant="outline" asChild>
                <a href="/dashboard/documents">Annuleren</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



