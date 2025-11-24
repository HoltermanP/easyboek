"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/app/dashboard/customers/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
  hasInvoices: boolean;
}

export function DeleteCustomerButton({
  customerId,
  customerName,
  hasInvoices,
}: DeleteCustomerButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);

    const formData = new FormData();
    formData.append("customerId", customerId);

    const result = await deleteCustomer(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Klant is verwijderd",
      });
      router.refresh();
    }

    setLoading(false);
  }

  if (hasInvoices) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        title="Kan niet verwijderen: klant heeft facturen"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Klant verwijderen?</AlertDialogTitle>
          <AlertDialogDescription>
            Weet je zeker dat je &quot;{customerName}&quot; wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
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
  );
}

