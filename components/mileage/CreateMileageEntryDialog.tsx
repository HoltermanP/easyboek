"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createMileageEntry } from "@/app/dashboard/mileage/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CreateMileageEntryDialogProps {
  companyId: string;
}

export function CreateMileageEntryDialog({ companyId }: CreateMileageEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("companyId", companyId);

    const result = await createMileageEntry(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Kilometerregistratie is toegevoegd",
      });
      setOpen(false);
      // Reset form
      e.currentTarget.reset();
      router.refresh();
    }

    setLoading(false);
  }

  // Set default date to today
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Registratie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe Kilometerregistratie</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe kilometerregistratie toe
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometers">Aantal Kilometers *</Label>
              <Input
                id="kilometers"
                name="kilometers"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromLocation">Van (vertrekpunt)</Label>
              <Input
                id="fromLocation"
                name="fromLocation"
                placeholder="Bijv. Amsterdam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toLocation">Naar (bestemming)</Label>
              <Input
                id="toLocation"
                name="toLocation"
                placeholder="Bijv. Utrecht"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Doel van de reis</Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Bijv. Klantbezoek, vergadering, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ratePerKm">Kilometervergoeding per km (€)</Label>
            <Input
              id="ratePerKm"
              name="ratePerKm"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.21"
              defaultValue="0.21"
            />
            <p className="text-xs text-muted-foreground">
              Standaard: €0.21 per km (2025 tarief). Laat leeg voor standaard tarief.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Toevoegen..." : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}







