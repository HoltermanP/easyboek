"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePreferences, getPreferences } from "@/app/dashboard/settings/actions";
import { useToast } from "@/hooks/use-toast";

interface PreferencesFormProps {
  initialPreferences?: {
    showUploads: boolean;
    showTimeEntries: boolean;
    showInvoices: boolean;
    showMileage: boolean;
    showBookings: boolean;
    showCustomers: boolean;
    showLedgerAccounts: boolean;
    showBtw: boolean;
    showReports: boolean;
    showRecurring: boolean;
    showTaxRules: boolean;
    showIncomeTax: boolean;
  } | null;
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    showUploads: true,
    showTimeEntries: true,
    showInvoices: true,
    showMileage: true,
    showBookings: false,
    showCustomers: false,
    showLedgerAccounts: false,
    showBtw: false,
    showReports: false,
    showRecurring: false,
    showTaxRules: false,
    showIncomeTax: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("showBookings", preferences.showBookings.toString());
    formData.append("showCustomers", preferences.showCustomers.toString());
    formData.append("showLedgerAccounts", preferences.showLedgerAccounts.toString());
    formData.append("showBtw", preferences.showBtw.toString());
    formData.append("showReports", preferences.showReports.toString());
    formData.append("showRecurring", preferences.showRecurring.toString());
    formData.append("showTaxRules", preferences.showTaxRules.toString());
    formData.append("showIncomeTax", preferences.showIncomeTax.toString());

    const result = await updatePreferences(formData);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Voorkeuren opgeslagen",
        description: "Uw voorkeuren zijn succesvol bijgewerkt.",
      });
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weergave Voorkeuren</CardTitle>
        <CardDescription>
          Kies welke modules u wilt zien in de sidebar. De minimale modules (Bonnen, Uren, Facturen, Kilometers) zijn altijd zichtbaar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Altijd zichtbaar (vereist)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={true} disabled />
                  <Label className="text-sm font-normal">Bonnen / Documenten</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={true} disabled />
                  <Label className="text-sm font-normal">Uren</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={true} disabled />
                  <Label className="text-sm font-normal">Facturen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={true} disabled />
                  <Label className="text-sm font-normal">Kilometers</Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Optionele modules</h3>
              <div className="space-y-2 pl-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showBookings"
                    checked={preferences.showBookings}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showBookings: checked === true })
                    }
                  />
                  <Label htmlFor="showBookings" className="text-sm font-normal cursor-pointer">
                    Boekingen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showCustomers"
                    checked={preferences.showCustomers}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showCustomers: checked === true })
                    }
                  />
                  <Label htmlFor="showCustomers" className="text-sm font-normal cursor-pointer">
                    Klanten
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLedgerAccounts"
                    checked={preferences.showLedgerAccounts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showLedgerAccounts: checked === true })
                    }
                  />
                  <Label htmlFor="showLedgerAccounts" className="text-sm font-normal cursor-pointer">
                    Grootboekrekeningen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showBtw"
                    checked={preferences.showBtw}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showBtw: checked === true })
                    }
                  />
                  <Label htmlFor="showBtw" className="text-sm font-normal cursor-pointer">
                    BTW
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showReports"
                    checked={preferences.showReports}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showReports: checked === true })
                    }
                  />
                  <Label htmlFor="showReports" className="text-sm font-normal cursor-pointer">
                    Rapportages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showRecurring"
                    checked={preferences.showRecurring}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showRecurring: checked === true })
                    }
                  />
                  <Label htmlFor="showRecurring" className="text-sm font-normal cursor-pointer">
                    Herhalende Boekingen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showTaxRules"
                    checked={preferences.showTaxRules}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showTaxRules: checked === true })
                    }
                  />
                  <Label htmlFor="showTaxRules" className="text-sm font-normal cursor-pointer">
                    Belastingregels
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showIncomeTax"
                    checked={preferences.showIncomeTax}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, showIncomeTax: checked === true })
                    }
                  />
                  <Label htmlFor="showIncomeTax" className="text-sm font-normal cursor-pointer">
                    Inkomstenbelasting
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Opslaan..." : "Voorkeuren opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}








