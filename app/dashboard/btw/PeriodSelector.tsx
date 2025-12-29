"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

interface Period {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface PeriodSelectorProps {
  periods: Period[];
  selectedPeriodId: string;
}

export function PeriodSelector({ periods, selectedPeriodId }: PeriodSelectorProps) {
  const router = useRouter();

  return (
    <Select
      value={selectedPeriodId}
      onValueChange={(value) => {
        router.push(`/dashboard/btw?period=${value}`);
      }}
    >
      <SelectTrigger>
        <SelectValue>
          {(() => {
            const period = periods.find(p => p.id === selectedPeriodId);
            if (!period) return "Selecteer periode";
            return `${format(period.startDate, "d MMM", { locale: nl })} - ${format(period.endDate, "d MMM yyyy", { locale: nl })}`;
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {periods.map((period) => (
          <SelectItem key={period.id} value={period.id}>
            {format(period.startDate, "d MMM", { locale: nl })} -{" "}
            {format(period.endDate, "d MMM yyyy", { locale: nl })}
            {period.status === "filed" && " (Ingediend)"}
            {period.status === "reopened" && " (Suppletie)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

