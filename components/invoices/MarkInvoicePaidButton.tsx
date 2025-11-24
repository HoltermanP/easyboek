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
import { CheckCircle2 } from "lucide-react";
import { markInvoiceAsPaid } from "@/app/dashboard/invoices/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface MarkInvoicePaidButtonProps {
  invoiceId: string;
}

export function MarkInvoicePaidButton({ invoiceId }: MarkInvoicePaidButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("invoiceId", invoiceId);

    const result = await markInvoiceAsPaid(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Factuur is gemarkeerd als betaald en geboekt",
      });
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  }

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Markeer als Betaald
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Factuur Markeren als Betaald</DialogTitle>
          <DialogDescription>
            Markeer deze factuur als betaald. Er wordt automatisch een betalingsboeking gemaakt:
            Bank (1000) debet, Debiteuren (1300) credit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Betaaldatum</Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              defaultValue={today}
              required
            />
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
              {loading ? "Verwerken..." : "Markeer als Betaald"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

