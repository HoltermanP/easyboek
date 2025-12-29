"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createInvoice } from "@/app/dashboard/invoices/actions";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  hourlyRate?: number | null;
}

interface CreateInvoiceFormProps {
  companyId: string;
  customers: Customer[];
  defaultInvoiceNumber: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  vat: number;
}

export function CreateInvoiceForm({
  companyId,
  customers,
  defaultInvoiceNumber,
}: CreateInvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"manual" | "hours">("manual");
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [hoursStartDate, setHoursStartDate] = useState(() => {
    // Eerste dag van huidige maand
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  });
  const [hoursEndDate, setHoursEndDate] = useState(() => {
    // Laatste dag van huidige maand
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [vatStandardRate, setVatStandardRate] = useState(21);
  const [vatReducedRate, setVatReducedRate] = useState(9);
  const [vatZeroRate, setVatZeroRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0, vat: 21 },
  ]);

  // Haal BTW tarieven op bij mount
  useEffect(() => {
    async function fetchTaxRates() {
      try {
        const response = await fetch(`/api/tax-rules/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setVatStandardRate(data.vatStandardRate);
          setVatReducedRate(data.vatReducedRate);
          setVatZeroRate(data.vatZeroRate);
          // Update eerste item met standaard BTW tarief
          setItems([{ description: "", quantity: 1, price: 0, vat: data.vatStandardRate }]);
        }
      } catch (error) {
        console.error("Error fetching tax rates:", error);
        // Gebruik defaults als ophalen faalt
      }
    }
    fetchTaxRates();
  }, [companyId]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0, vat: 21 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.price;
      const vatAmount = subtotal * (item.vat / 100);
      return sum + subtotal + vatAmount;
    }, 0);
  };

  const calculateVatTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.price;
      return sum + subtotal * (item.vat / 100);
    }, 0);
  };

  const loadHours = async () => {
    if (!customerId) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een klant",
        variant: "destructive",
      });
      return;
    }

    setLoadingHours(true);
    try {
      const response = await fetch(
        `/api/time-entries?companyId=${companyId}&customerId=${customerId}&startDate=${hoursStartDate}&endDate=${hoursEndDate}`
      );

      if (!response.ok) {
        throw new Error("Fout bij ophalen uren");
      }

      const data = await response.json();
      const timeEntries = data.timeEntries.filter((entry: any) => !entry.invoiceId);

      if (timeEntries.length === 0) {
        toast({
          title: "Geen uren gevonden",
          description: "Er zijn geen niet-gefactureerde uren gevonden voor deze periode",
          variant: "destructive",
        });
        setLoadingHours(false);
        return;
      }

      // Groepeer uren per dag en bereken totaal
      const groupedByDate: Record<string, { hours: number; descriptions: string[] }> = {};
      
      timeEntries.forEach((entry: any) => {
        const dateStr = entry.date.split("T")[0];
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { hours: 0, descriptions: [] };
        }
        groupedByDate[dateStr].hours += Number(entry.hours);
        if (entry.description) {
          groupedByDate[dateStr].descriptions.push(entry.description);
        }
      });

      // Maak factuurregels van de uren
      const newItems: InvoiceItem[] = [];
      const selectedCustomer = customers.find((c) => c.id === customerId);
      
      Object.entries(groupedByDate).forEach(([dateStr, data]) => {
        const entry = timeEntries.find((e: any) => e.date.startsWith(dateStr));
        const hourlyRate = 
          entry?.hourlyRate || 
          entry?.customer?.hourlyRate || 
          selectedCustomer?.hourlyRate || 
          timeEntries[0]?.customer?.hourlyRate || 
          0;
        const dateObj = new Date(dateStr);
        const dateFormatted = dateObj.toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
        });

        newItems.push({
          description: `Uren gewerkt op ${dateFormatted}${data.descriptions.length > 0 ? `: ${data.descriptions[0]}` : ""}`,
          quantity: data.hours,
          price: hourlyRate,
          vat: vatStandardRate,
        });
      });

      setItems(newItems);
      toast({
        title: "Succes",
        description: `${timeEntries.length} urenregistraties geladen`,
      });
    } catch (error) {
      console.error("Error loading hours:", error);
      toast({
        title: "Fout",
        description: "Kon uren niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoadingHours(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Fout",
        description: "Selecteer een klant",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => !item.description || item.price <= 0)) {
      toast({
        title: "Fout",
        description: "Vul alle factuurregels correct in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("customerId", customerId);
    formData.append("number", invoiceNumber);
    formData.append("date", date);
    formData.append("dueDate", dueDate);
    formData.append("items", JSON.stringify(items));
    formData.append("total", calculateTotal().toString());
    formData.append("vatTotal", calculateVatTotal().toString());
    
    // Als factuur op basis van uren, voeg periode toe
    if (invoiceType === "hours" && hoursStartDate && hoursEndDate) {
      formData.append("hoursStartDate", hoursStartDate);
      formData.append("hoursEndDate", hoursEndDate);
    }

    const result = await createInvoice(formData);
    setLoading(false);

    if (result.error) {
      toast({
        title: "Fout",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succes",
        description: "Factuur is aangemaakt",
      });
      router.push("/dashboard/invoices");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Factuurtype</CardTitle>
          <CardDescription>Kies hoe u de factuur wilt aanmaken</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={invoiceType} onValueChange={(value) => setInvoiceType(value as "manual" | "hours")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Handmatig</TabsTrigger>
              <TabsTrigger value="hours">Op basis van uren</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Factuurgegevens</CardTitle>
            <CardDescription>Basis informatie voor de factuur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Klant *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een klant" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Geen klanten beschikbaar
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {invoiceType === "hours" && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Periode voor uren</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Van</Label>
                      <Input
                        type="date"
                        value={hoursStartDate}
                        onChange={(e) => setHoursStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tot</Label>
                      <Input
                        type="date"
                        value={hoursEndDate}
                        onChange={(e) => setHoursEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadHours}
                  disabled={loadingHours || !customerId}
                  className="w-full"
                >
                  {loadingHours ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Laad uren voor periode
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="number">Factuurnummer *</Label>
              <Input
                id="number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Factuurdatum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Vervaldatum *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factuurregels</CardTitle>
            <CardDescription>
              {invoiceType === "hours"
                ? "Uren worden automatisch geladen. U kunt deze nog aanpassen."
                : "Voeg regels toe aan de factuur"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {invoiceType === "hours"
                  ? "Selecteer een klant en laad uren om factuurregels te genereren"
                  : "Voeg een regel toe om te beginnen"}
              </p>
            ) : (
              items.map((item, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Regel {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Omschrijving *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    placeholder="Bijv. Website ontwikkeling"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Aantal</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Prijs (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>BTW (%)</Label>
                    <Select
                      value={item.vat.toString()}
                      onValueChange={(value) =>
                        updateItem(index, "vat", parseFloat(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={vatStandardRate.toString()}>
                          {vatStandardRate}% (Standaard)
                        </SelectItem>
                        <SelectItem value={vatReducedRate.toString()}>
                          {vatReducedRate}% (Verlaagd)
                        </SelectItem>
                        <SelectItem value={vatZeroRate.toString()}>
                          {vatZeroRate}% (Nul)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Subtotaal: €
                  {(item.quantity * item.price).toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  | BTW: €
                  {(item.quantity * item.price * (item.vat / 100)).toLocaleString(
                    "nl-NL",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>
              </div>
              ))
            )}

            {invoiceType === "manual" && (
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Regel toevoegen
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotaal:</span>
              <span>
                €
                {(calculateTotal() - calculateVatTotal()).toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>BTW:</span>
              <span>
                €{calculateVatTotal().toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Totaal:</span>
              <span>
                €{calculateTotal().toLocaleString("nl-NL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuleren
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Aanmaken..." : "Factuur aanmaken"}
        </Button>
      </div>
    </form>
  );
}



