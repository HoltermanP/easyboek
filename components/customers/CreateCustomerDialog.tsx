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
import { createCustomer } from "@/app/dashboard/customers/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CreateCustomerDialogProps {
  companyId: string;
}

export function CreateCustomerDialog({ companyId }: CreateCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("companyId", companyId);

    const result = await createCustomer(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Klant is aangemaakt",
      });
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Klant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe Klant</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe klant toe aan je administratie
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Bedrijfsnaam of naam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="klant@voorbeeld.nl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              name="address"
              placeholder="Straatnaam en huisnummer"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode</Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="1234AB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                name="city"
                placeholder="Amsterdam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                name="country"
                placeholder="NL"
                defaultValue="NL"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              {loading ? "Aanmaken..." : "Klant Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

