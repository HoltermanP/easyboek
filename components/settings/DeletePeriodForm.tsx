"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deletePeriodData } from "@/app/dashboard/settings/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  year: number;
}

interface DeletePeriodFormProps {
  companies: Company[];
}

export function DeletePeriodForm({ companies }: DeletePeriodFormProps) {
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    if (!companyId || !startDate || !endDate) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    const result = await deletePeriodData(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: `Verwijderd: ${result.deleted?.bookings || 0} boekingen, ${result.deleted?.invoices || 0} facturen, ${result.deleted?.documents || 0} documenten`,
      });
      setCompanyId("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    }

    setLoading(false);
  }

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company">Administratie</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger id="company">
            <SelectValue placeholder="Selecteer administratie" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name} ({company.year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Van Datum</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Tot Datum</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {selectedCompany && startDate && endDate && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Te verwijderen:</p>
          <p className="text-sm text-muted-foreground">
            Alle boekingen, facturen en documenten van {startDate} tot {endDate} in administratie {selectedCompany.name} ({selectedCompany.year})
          </p>
        </div>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!companyId || !startDate || !endDate || loading}>
            Verwijder Periode Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Alle boekingen, facturen en documenten binnen de geselecteerde periode ({startDate} tot {endDate}) worden permanent verwijderd uit administratie {selectedCompany?.name} ({selectedCompany?.year}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Verwijderen..." : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

