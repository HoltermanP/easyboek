"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBookingAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface BookDocumentClientProps {
  document: {
    id: string;
    originalFilename: string;
    aiCategory: string | null;
    ocrText: string | null;
    createdAt: Date;
  };
  company: {
    id: string;
  };
  costAccounts: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  bankAccount: {
    id: string;
  } | null;
  suggestedAccountId: string;
  suggestedAmount: number;
}

export function BookDocumentClient({
  document,
  company,
  costAccounts,
  bankAccount,
  suggestedAccountId,
  suggestedAmount,
}: BookDocumentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedAccountId, setSelectedAccountId] = useState(suggestedAccountId);
  const [showBusinessDialog, setShowBusinessDialog] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isRepresentationCosts, setIsRepresentationCosts] = useState(false);

  // Check of de geselecteerde rekening representatiekosten is (4680)
  useEffect(() => {
    const selectedAccount = costAccounts.find((acc) => acc.id === selectedAccountId);
    setIsRepresentationCosts(selectedAccount?.code === "4680");
  }, [selectedAccountId, costAccounts]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formDataObj = new FormData(form);

    // Als het representatiekosten zijn, toon eerst de bevestigingsdialog
    if (isRepresentationCosts) {
      setFormData(formDataObj);
      setShowBusinessDialog(true);
    } else {
      // Direct boeken als het geen representatiekosten zijn
      formDataObj.append("isBusinessConfirmed", "true");
      startTransition(async () => {
        try {
          await createBookingAction(formDataObj);
        } catch (error) {
          toast({
            title: "Fout",
            description: error instanceof Error ? error.message : "Er is een fout opgetreden",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleConfirmBusiness = () => {
    if (formData) {
      formData.append("isBusinessConfirmed", "true");
      setShowBusinessDialog(false);
      startTransition(async () => {
        try {
          await createBookingAction(formData);
        } catch (error) {
          toast({
            title: "Fout",
            description: error instanceof Error ? error.message : "Er is een fout opgetreden",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleCancelBusiness = () => {
    setShowBusinessDialog(false);
    setFormData(null);
  };

  return (
    <>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {costAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Bedrag (incl. BTW)</Label>
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
                <Label htmlFor="vatCode">BTW Code</Label>
                <select
                  id="vatCode"
                  name="vatCode"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Geen BTW</option>
                  <option value="HOOG">Hoog (21%)</option>
                  <option value="LAAG">Laag (9%)</option>
                  <option value="NUL">Nul (0%)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecteer het BTW tarief dat op dit document van toepassing is
                </p>
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
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Bezig..." : "Boeking Aanmaken"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/documents")} disabled={isPending}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Is deze uitgave zakelijk?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                Je probeert een uitgave te boeken op <strong>Representatiekosten (4680)</strong>.
              </p>
              <div className="bg-slate-50 p-4 rounded-md space-y-2">
                <p className="font-semibold text-sm">Wat is zakelijk?</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-slate-700">
                  <li>Uitgaven die direct gerelateerd zijn aan je bedrijf</li>
                  <li>Kosten voor zakelijke lunches, diners of borrels met klanten, leveranciers of zakenpartners</li>
                  <li>Netwerkbijeenkomsten en zakelijke evenementen</li>
                  <li>Relatiegeschenken en zakelijke entertainment</li>
                </ul>
                <p className="text-xs text-slate-600 mt-2">
                  <strong>Let op:</strong> Privé uitgaven (zoals persoonlijke lunch of diner) zijn niet aftrekbaar en moeten niet als representatiekosten worden geboekt.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelBusiness} disabled={isPending}>
              Nee, annuleren
            </Button>
            <Button onClick={handleConfirmBusiness} disabled={isPending}>
              {isPending ? "Bezig..." : "Ja, dit is zakelijk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

