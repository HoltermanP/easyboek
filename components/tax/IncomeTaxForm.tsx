"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { saveIncomeTaxData } from "@/app/dashboard/income-tax/actions";
import { Loader2 } from "lucide-react";

interface IncomeTaxData {
  id?: string;
  companyId: string;
  year: number;
  maritalStatus: string;
  otherIncome: number | null;
  mortgageInterest: number | null;
  healthcareCosts: number | null;
  educationCosts: number | null;
  otherDeductions: number | null;
  partnerIncome: number | null;
}

interface IncomeTaxFormProps {
  companyId: string;
  year: number;
  initialData?: IncomeTaxData | null;
}

export function IncomeTaxForm({ companyId, year, initialData }: IncomeTaxFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IncomeTaxData>({
    companyId,
    year,
    maritalStatus: initialData?.maritalStatus || "single",
    otherIncome: initialData?.otherIncome || null,
    mortgageInterest: initialData?.mortgageInterest || null,
    healthcareCosts: initialData?.healthcareCosts || null,
    educationCosts: initialData?.educationCosts || null,
    otherDeductions: initialData?.otherDeductions || null,
    partnerIncome: initialData?.partnerIncome || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("companyId", companyId);
      formDataToSend.append("maritalStatus", formData.maritalStatus);
      formDataToSend.append("otherIncome", (formData.otherIncome || 0).toString());
      formDataToSend.append("mortgageInterest", (formData.mortgageInterest || 0).toString());
      formDataToSend.append("healthcareCosts", (formData.healthcareCosts || 0).toString());
      formDataToSend.append("educationCosts", (formData.educationCosts || 0).toString());
      formDataToSend.append("otherDeductions", (formData.otherDeductions || 0).toString());
      formDataToSend.append("partnerIncome", (formData.partnerIncome || 0).toString());

      const result = await saveIncomeTaxData(formDataToSend);

      if (result.error) {
        toast({
          title: "Fout",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succes",
          description: "Belastinggegevens opgeslagen",
        });
      }
    } catch (error) {
      console.error("Error saving income tax data:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof IncomeTaxData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? null : typeof value === "string" ? parseFloat(value) || null : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Persoonlijke Situatie</CardTitle>
          <CardDescription>
            Gegevens die nodig zijn voor de inkomstenbelasting berekening
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Burgerlijke staat</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => updateField("maritalStatus", value)}
            >
              <SelectTrigger id="maritalStatus">
                <SelectValue placeholder="Selecteer burgerlijke staat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Alleenstaand</SelectItem>
                <SelectItem value="married">Gehuwd</SelectItem>
                <SelectItem value="registered_partnership">Geregistreerd partnerschap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Andere Inkomsten</CardTitle>
          <CardDescription>
            Inkomen dat niet uit uw onderneming komt (loon, uitkering, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otherIncome">Andere inkomsten (€)</Label>
            <Input
              id="otherIncome"
              type="number"
              step="0.01"
              value={formData.otherIncome || ""}
              onChange={(e) => updateField("otherIncome", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aftrekposten</CardTitle>
          <CardDescription>
            Kosten die u kunt aftrekken van uw belastbaar inkomen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mortgageInterest">Hypotheekrente (€)</Label>
            <Input
              id="mortgageInterest"
              type="number"
              step="0.01"
              value={formData.mortgageInterest || ""}
              onChange={(e) => updateField("mortgageInterest", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthcareCosts">Zorgkosten (€)</Label>
            <Input
              id="healthcareCosts"
              type="number"
              step="0.01"
              value={formData.healthcareCosts || ""}
              onChange={(e) => updateField("healthcareCosts", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="educationCosts">Studiekosten (€)</Label>
            <Input
              id="educationCosts"
              type="number"
              step="0.01"
              value={formData.educationCosts || ""}
              onChange={(e) => updateField("educationCosts", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherDeductions">Overige aftrekposten (€)</Label>
            <Input
              id="otherDeductions"
              type="number"
              step="0.01"
              value={formData.otherDeductions || ""}
              onChange={(e) => updateField("otherDeductions", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {(formData.maritalStatus === "married" || formData.maritalStatus === "registered_partnership") && (
        <Card>
          <CardHeader>
            <CardTitle>Partner Gegevens</CardTitle>
            <CardDescription>
              Inkomen van uw partner (indien van toepassing)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partnerIncome">Partner inkomen (€)</Label>
              <Input
                id="partnerIncome"
                type="number"
                step="0.01"
                value={formData.partnerIncome || ""}
                onChange={(e) => updateField("partnerIncome", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            "Gegevens opslaan"
          )}
        </Button>
      </div>
    </form>
  );
}

