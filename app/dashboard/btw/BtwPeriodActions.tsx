"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface BtwPeriodActionsProps {
  periodId: string;
  status: string;
}

export function BtwPeriodActions({ periodId, status }: BtwPeriodActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = async (newStatus: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/btw/period-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            periodId,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Fout bij wijzigen status");
        }

        toast({
          title: "Status bijgewerkt",
          description: `BTW periode is nu ${newStatus === "filed" ? "ingediend" : newStatus === "reopened" ? "heropend" : "klaar voor aangifte"}.`,
        });

        router.refresh();
      } catch (error: any) {
        toast({
          title: "Fout",
          description: error.message || "Er is een fout opgetreden",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      {status === "open" && (
        <Button
          onClick={() => handleStatusChange("ready")}
          disabled={isPending}
          variant="default"
        >
          {isPending ? "Bezig..." : "Markeer als klaar voor aangifte"}
        </Button>
      )}
      {status === "ready" && (
        <>
          <Button
            onClick={() => handleStatusChange("filed")}
            disabled={isPending}
            variant="default"
          >
            {isPending ? "Bezig..." : "Markeer als ingediend"}
          </Button>
          <Button
            onClick={() => handleStatusChange("open")}
            disabled={isPending}
            variant="outline"
          >
            {isPending ? "Bezig..." : "Terug naar open"}
          </Button>
        </>
      )}
      {status === "filed" && (
        <Button
          onClick={() => handleStatusChange("reopened")}
          disabled={isPending}
          variant="outline"
        >
          {isPending ? "Bezig..." : "Heropen voor suppletie"}
        </Button>
      )}
      {status === "reopened" && (
        <>
          <Button
            onClick={() => handleStatusChange("filed")}
            disabled={isPending}
            variant="default"
          >
            {isPending ? "Bezig..." : "Markeer als ingediend"}
          </Button>
          <Badge variant="secondary" className="ml-2">
            Suppletie
          </Badge>
        </>
      )}
    </div>
  );
}

