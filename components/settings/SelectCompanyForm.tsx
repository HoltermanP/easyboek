"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Company {
  id: string;
  name: string;
  year: number;
}

interface SelectCompanyFormProps {
  companies: Company[];
  selectedCompanyId?: string;
}

export function SelectCompanyForm({ companies, selectedCompanyId }: SelectCompanyFormProps) {
  const router = useRouter();

  async function handleSelect(value: string) {
    try {
      const response = await fetch("/api/select-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId: value }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error selecting company:", error);
    }
  }

  return (
    <Select value={selectedCompanyId} onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Selecteer administratie" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name} ({company.year})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

