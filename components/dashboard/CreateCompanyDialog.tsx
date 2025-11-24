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
import { createCompany } from "@/app/dashboard/settings/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createCompany(formData);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Bedrijf is aangemaakt",
      });
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nieuw Bedrijf Aanmaken</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nieuw Bedrijf Aanmaken</DialogTitle>
            <DialogDescription>
              Vul de gegevens van uw bedrijf in om te beginnen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bedrijfsnaam *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Bijv. Mijn ZZP Bedrijf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Jaar *</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min="2020"
                max="2100"
                defaultValue={new Date().getFullYear()}
                required
              />
              <p className="text-xs text-muted-foreground">
                Elke administratie is per jaar. Maak een nieuwe administratie aan voor elk boekjaar.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kvkNumber">KVK Nummer</Label>
              <Input
                id="kvkNumber"
                name="kvkNumber"
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btwNumber">BTW Nummer</Label>
              <Input
                id="btwNumber"
                name="btwNumber"
                placeholder="NL123456789B01"
              />
            </div>
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
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



