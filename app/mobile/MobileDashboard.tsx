"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Clock, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  hourlyRate?: number | null;
}

interface OverviewData {
  inkomsten: number;
  uitgaven: number;
  winst: number;
  verwachteInkomsten: number;
  verwachteWinst: number;
  ibReservering: number;
  btwReservering: number;
}

interface MobileDashboardProps {
  companyId: string;
  customers: Customer[];
}

export function MobileDashboard({ companyId, customers }: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState("overzicht");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [timeEntry, setTimeEntry] = useState({
    customerId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    description: "",
  });
  const [submittingTime, setSubmittingTime] = useState(false);
  const { toast } = useToast();

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mobile/overview");
      if (!response.ok) throw new Error("Fout bij ophalen data");
      const data = await response.json();
      setOverviewData(data);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon overzicht niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Haal overzichtsdata op
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Camera/upload handler
  const handleCameraClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Gebruik achterste camera op mobiel
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await handleFileUpload(file);
    };
    input.click();
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "receipt");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload mislukt");
      }

      toast({
        title: "Bon geüpload",
        description: data.bookingCreated
          ? "Boeking automatisch aangemaakt"
          : "Boeking voorstel beschikbaar",
      });

      // Refresh overzicht
      await fetchOverview();
    } catch (error) {
      toast({
        title: "Upload fout",
        description: error instanceof Error ? error.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Tijdregistratie handler
  const handleTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!timeEntry.customerId || !timeEntry.hours) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }

    setSubmittingTime(true);
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          customerId: timeEntry.customerId,
          date: timeEntry.date,
          hours: parseFloat(timeEntry.hours),
          description: timeEntry.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fout bij opslaan");
      }

      toast({
        title: "Uren opgeslagen",
        description: "Uw uren zijn succesvol geregistreerd",
      });

      // Reset form
      setTimeEntry({
        customerId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        hours: "",
        description: "",
      });

      // Refresh overzicht
      await fetchOverview();
    } catch (error) {
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setSubmittingTime(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Mobiel Dashboard</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="container mx-auto px-4 py-4">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="bon">Bon</TabsTrigger>
          <TabsTrigger value="uren">Uren</TabsTrigger>
        </TabsList>

        {/* Overzicht Tab */}
        <TabsContent value="overzicht" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : overviewData ? (
            <>
              {/* Inkomsten */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Inkomsten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">
                    {formatCurrency(overviewData.inkomsten)}
                  </div>
                </CardContent>
              </Card>

              {/* Uitgaven */}
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Uitgaven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">
                    {formatCurrency(overviewData.uitgaven)}
                  </div>
                </CardContent>
              </Card>

              {/* Winst */}
              <Card className={overviewData.winst >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Winst (lopende maand)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${overviewData.winst >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatCurrency(overviewData.winst)}
                  </div>
                </CardContent>
              </Card>

              {/* Verwachte inkomsten */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Verwachte inkomsten</CardTitle>
                  <CardDescription>Openstaande facturen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(overviewData.verwachteInkomsten)}
                  </div>
                </CardContent>
              </Card>

              {/* Verwachte winst */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Verwachte winst</CardTitle>
                  <CardDescription>Inclusief openstaande facturen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${overviewData.verwachteWinst >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatCurrency(overviewData.verwachteWinst)}
                  </div>
                </CardContent>
              </Card>

              {/* Reserveringen */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Reserveringen</CardTitle>
                  <CardDescription>Voor belastingen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IB te reserveren:</span>
                    <span className="font-bold">{formatCurrency(overviewData.ibReservering)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">BTW te reserveren:</span>
                    <span className="font-bold">{formatCurrency(overviewData.btwReservering)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Totaal:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(overviewData.ibReservering + overviewData.btwReservering)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={fetchOverview} variant="outline" className="w-full">
                Ververs
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Geen data beschikbaar
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bon Upload Tab */}
        <TabsContent value="bon" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bon uploaden</CardTitle>
              <CardDescription>
                Maak een foto van uw bon. De app maakt automatisch een voorstel boeking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCameraClick}
                disabled={uploading}
                size="lg"
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploaden...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Maak foto van bon
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                Of selecteer een bestand
              </div>


              <Button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      await handleFileUpload(file);
                    }
                  };
                  input.click();
                }}
                variant="outline"
                disabled={uploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecteer bestand
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uren Tab */}
        <TabsContent value="uren" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uren registreren</CardTitle>
              <CardDescription>
                Registreer uw gewerkte uren voor een klant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTimeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Klant *</Label>
                  <Select
                    value={timeEntry.customerId}
                    onValueChange={(value) =>
                      setTimeEntry({ ...timeEntry, customerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer klant" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={timeEntry.date}
                    onChange={(e) =>
                      setTimeEntry({ ...timeEntry, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Aantal uren *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0"
                    value={timeEntry.hours}
                    onChange={(e) =>
                      setTimeEntry({ ...timeEntry, hours: e.target.value })
                    }
                    placeholder="bijv. 7.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Omschrijving (optioneel)</Label>
                  <Input
                    id="description"
                    type="text"
                    value={timeEntry.description}
                    onChange={(e) =>
                      setTimeEntry({ ...timeEntry, description: e.target.value })
                    }
                    placeholder="Wat heb je gedaan?"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingTime}
                  size="lg"
                  className="w-full"
                >
                  {submittingTime ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Opslaan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

