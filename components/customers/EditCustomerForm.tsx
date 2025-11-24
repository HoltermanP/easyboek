"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomer } from "@/app/dashboard/customers/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
}

interface EditCustomerFormProps {
  customer: Customer;
}

export function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("customerId", customer.id);

    const result = await updateCustomer(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Klantgegevens zijn bijgewerkt",
      });
      router.push("/dashboard/customers");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Naam *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Bedrijfsnaam of naam"
            defaultValue={customer.name}
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
            defaultValue={customer.email || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          name="address"
          placeholder="Straatnaam en huisnummer"
          defaultValue={customer.address || ""}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postcode</Label>
          <Input
            id="postalCode"
            name="postalCode"
            placeholder="1234AB"
            defaultValue={customer.postalCode || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Plaats</Label>
          <Input
            id="city"
            name="city"
            placeholder="Amsterdam"
            defaultValue={customer.city || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Land</Label>
          <Input
            id="country"
            name="country"
            placeholder="NL"
            defaultValue={customer.country || "NL"}
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
            defaultValue={customer.kvkNumber || ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="btwNumber">BTW Nummer</Label>
          <Input
            id="btwNumber"
            name="btwNumber"
            placeholder="NL123456789B01"
            defaultValue={customer.btwNumber || ""}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuleren
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </form>
  );
}

