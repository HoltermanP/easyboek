"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateRecurringBookingFormProps {
  companyId: string;
  costAccounts: Array<{ id: string; code: string; name: string }>;
  bankAccounts: Array<{ id: string; code: string; name: string }>;
  userId: string;
}

export function CreateRecurringBookingForm({
  companyId,
  costAccounts,
  bankAccounts,
  userId,
}: CreateRecurringBookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      companyId,
      description: formData.get("description") as string,
      debitAccountId: formData.get("debitAccountId") as string,
      creditAccountId: formData.get("creditAccountId") as string,
      amount: parseFloat(formData.get("amount") as string),
      frequency: formData.get("frequency") as string,
      dayOfMonth: parseInt(formData.get("dayOfMonth") as string),
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || null,
      vatCode: formData.get("vatCode") as string || null,
      createdBy: userId,
    };

    try {
      const response = await fetch("/api/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fout bij aanmaken herhalende boeking");
      }

      router.push("/dashboard/recurring");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Herhalende Boeking Aanmaken</CardTitle>
        <CardDescription>
          Configureer een automatische boeking die periodiek wordt aangemaakt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Omschrijving *</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="Bijv. Maandelijkse hosting kosten"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="debitAccountId">Kosten Rekening (Debet) *</Label>
              <Select name="debitAccountId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer rekening" />
                </SelectTrigger>
                <SelectContent>
                  {costAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditAccountId">Bank Rekening (Credit) *</Label>
              <Select name="creditAccountId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer rekening" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Bedrag *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequentie *</Label>
              <Select name="frequency" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer frequentie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Maandelijks</SelectItem>
                  <SelectItem value="quarterly">Per kwartaal</SelectItem>
                  <SelectItem value="yearly">Jaarlijks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Dag van de maand *</Label>
              <Input
                id="dayOfMonth"
                name="dayOfMonth"
                type="number"
                min="1"
                max="31"
                required
                defaultValue="1"
              />
              <p className="text-xs text-muted-foreground">
                Op welke dag van de maand moet deze boeking worden aangemaakt?
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Startdatum *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Einddatum (optioneel)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
              />
              <p className="text-xs text-muted-foreground">
                Laat leeg voor onbeperkt
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatCode">BTW Code (optioneel)</Label>
            <Input
              id="vatCode"
              name="vatCode"
              placeholder="Bijv. HOOG, LAAG"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

