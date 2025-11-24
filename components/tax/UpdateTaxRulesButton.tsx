"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

interface UpdateTaxRulesButtonProps {
  companyId: string;
  year: number;
}

export function UpdateTaxRulesButton({
  companyId,
  year,
}: UpdateTaxRulesButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tax-rules/${companyId}/update`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fout bij ophalen belastingregels");
      }

      toast({
        title: "Succes",
        description: `Belastingregels voor ${year} zijn bijgewerkt met de nieuwste informatie.`,
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating tax rules:", error);
      toast({
        title: "Fout",
        description:
          error instanceof Error
            ? error.message
            : "Fout bij ophalen belastingregels. Controleer of OPENAI_API_KEY is ingesteld.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpdate}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Ophalen...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Haal nieuwste regels op
        </>
      )}
    </Button>
  );
}

