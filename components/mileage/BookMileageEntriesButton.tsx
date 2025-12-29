"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { bookAllMileageEntries } from "@/app/dashboard/mileage/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface BookMileageEntriesButtonProps {
  companyId: string;
  unbookedCount: number;
}

export function BookMileageEntriesButton({
  companyId,
  unbookedCount,
}: BookMileageEntriesButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleBook() {
    if (unbookedCount === 0) {
      toast({
        title: "Geen registraties",
        description: "Er zijn geen niet-geboekte registraties om te boeken",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("companyId", companyId);

    const result = await bookAllMileageEntries(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: result.message || `${result.booked} registraties geboekt`,
      });
      router.refresh();
    }

    setLoading(false);
  }

  if (unbookedCount === 0) {
    return null;
  }

  return (
    <Button onClick={handleBook} disabled={loading}>
      <BookOpen className="mr-2 h-4 w-4" />
      {loading ? "Boeken..." : `Boek ${unbookedCount} registratie${unbookedCount !== 1 ? "s" : ""}`}
    </Button>
  );
}








