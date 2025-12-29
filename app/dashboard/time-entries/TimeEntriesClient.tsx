"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  hourlyRate: number | null;
}

interface TimeEntry {
  id?: string;
  date: string;
  customerId: string;
  hours: number;
  description: string;
  hourlyRate: number | null;
}

interface TimeEntriesClientProps {
  companyId: string;
  customers: Customer[];
}

export function TimeEntriesClient({ companyId, customers }: TimeEntriesClientProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Start van huidige week (maandag)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Aanpassen naar maandag
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0];
  });

  const [entries, setEntries] = useState<Record<string, TimeEntry[]>>({});
  const [savedEntries, setSavedEntries] = useState<Record<string, any[]>>({});

  const weekDays = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

  // Bereken datums voor de huidige week
  const getWeekDates = () => {
    const start = new Date(currentWeekStart);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Laad uren voor de huidige week
  useEffect(() => {
    loadTimeEntries();
  }, [currentWeekStart, companyId]);

  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const response = await fetch(
        `/api/time-entries?companyId=${companyId}&startDate=${currentWeekStart}&endDate=${weekEnd.toISOString().split("T")[0]}`
      );

      if (!response.ok) {
        throw new Error("Fout bij ophalen uren");
      }

      const data = await response.json();
      const entriesByDate: Record<string, any[]> = {};

      data.timeEntries.forEach((entry: any) => {
        const dateStr = entry.date.split("T")[0];
        if (!entriesByDate[dateStr]) {
          entriesByDate[dateStr] = [];
        }
        entriesByDate[dateStr].push(entry);
      });

      setSavedEntries(entriesByDate);

      // Initialiseer entries state met bestaande data
      const newEntries: Record<string, TimeEntry[]> = {};
      weekDates.forEach((date) => {
        const dateStr = date.toISOString().split("T")[0];
        newEntries[dateStr] = entriesByDate[dateStr]?.map((e) => ({
          id: e.id,
          date: dateStr,
          customerId: e.customerId,
          hours: Number(e.hours),
          description: e.description || "",
          hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : null,
        })) || [];
      });

      setEntries(newEntries);
    } catch (error) {
      console.error("Error loading time entries:", error);
      toast({
        title: "Fout",
        description: "Kon uren niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDefaults = async () => {
    setLoadingDefaults(true);
    try {
      const response = await fetch(
        `/api/time-entries/defaults?companyId=${companyId}&weekStart=${currentWeekStart}`
      );

      if (!response.ok) {
        throw new Error("Fout bij ophalen standaard uren");
      }

      const data = await response.json();
      const newEntries = { ...entries };

      data.defaults.forEach((defaultEntry: any) => {
        const dateStr = defaultEntry.date;
        if (!newEntries[dateStr]) {
          newEntries[dateStr] = [];
        }

        // Check of er al een entry is voor deze datum en klant
        const existingIndex = newEntries[dateStr].findIndex(
          (e) => e.customerId === defaultEntry.customerId
        );

        if (existingIndex === -1) {
          // Voeg alleen toe als er nog geen entry is
          newEntries[dateStr].push({
            date: dateStr,
            customerId: defaultEntry.customerId,
            hours: defaultEntry.hours,
            description: defaultEntry.description || "",
            hourlyRate: defaultEntry.hourlyRate ? Number(defaultEntry.hourlyRate) : null,
          });
        }
      });

      setEntries(newEntries);
      toast({
        title: "Succes",
        description: "Standaard uren zijn ingevuld op basis van vorige weken",
      });
    } catch (error) {
      console.error("Error loading defaults:", error);
      toast({
        title: "Fout",
        description: "Kon standaard uren niet ophalen",
        variant: "destructive",
      });
    } finally {
      setLoadingDefaults(false);
    }
  };

  const addEntry = (date: string) => {
    const newEntries = { ...entries };
    if (!newEntries[date]) {
      newEntries[date] = [];
    }
    newEntries[date].push({
      date,
      customerId: customers[0]?.id || "",
      hours: 0,
      description: "",
      hourlyRate: customers[0]?.hourlyRate || null,
    });
    setEntries(newEntries);
  };

  const removeEntry = (date: string, index: number) => {
    const newEntries = { ...entries };
    if (newEntries[date]) {
      const entry = newEntries[date][index];
      // Als het een bestaande entry is, verwijder via API
      if (entry.id) {
        deleteEntry(entry.id, date, index);
      } else {
        newEntries[date].splice(index, 1);
        setEntries(newEntries);
      }
    }
  };

  const deleteEntry = async (id: string, date: string, index: number) => {
    try {
      const response = await fetch(`/api/time-entries?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Fout bij verwijderen");
      }

      const newEntries = { ...entries };
      if (newEntries[date]) {
        newEntries[date].splice(index, 1);
        setEntries(newEntries);
      }

      toast({
        title: "Succes",
        description: "Urenregistratie verwijderd",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Fout",
        description: "Kon urenregistratie niet verwijderen",
        variant: "destructive",
      });
    }
  };

  const updateEntry = (date: string, index: number, field: keyof TimeEntry, value: any) => {
    const newEntries = { ...entries };
    if (newEntries[date] && newEntries[date][index]) {
      newEntries[date][index] = {
        ...newEntries[date][index],
        [field]: value,
      };
      // Update hourlyRate als customerId verandert
      if (field === "customerId") {
        const customer = customers.find((c) => c.id === value);
        newEntries[date][index].hourlyRate = customer?.hourlyRate || null;
      }
      setEntries(newEntries);
    }
  };

  const saveEntry = async (entry: TimeEntry) => {
    try {
      const method = entry.id ? "PUT" : "POST";
      const url = entry.id ? "/api/time-entries" : "/api/time-entries";
      const body = entry.id
        ? {
            id: entry.id,
            date: entry.date,
            hours: entry.hours,
            description: entry.description,
            hourlyRate: entry.hourlyRate,
          }
        : {
            companyId,
            customerId: entry.customerId,
            date: entry.date,
            hours: entry.hours,
            description: entry.description,
            hourlyRate: entry.hourlyRate,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Fout bij opslaan");
      }

      const data = await response.json();
      return data.timeEntry;
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  };

  const saveAll = async () => {
    setLoading(true);
    try {
      const allEntries: TimeEntry[] = [];
      Object.values(entries).forEach((dayEntries) => {
        dayEntries.forEach((entry) => {
          if (entry.customerId && entry.hours > 0) {
            allEntries.push(entry);
          }
        });
      });

      // Filter nieuwe entries (zonder id)
      const newEntries = allEntries.filter((e) => !e.id);
      const existingEntries = allEntries.filter((e) => e.id);

      // Sla nieuwe entries op in bulk
      if (newEntries.length > 0) {
        const response = await fetch("/api/time-entries/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyId,
            entries: newEntries.map((e) => ({
              customerId: e.customerId,
              date: e.date,
              hours: e.hours,
              description: e.description,
              hourlyRate: e.hourlyRate,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Fout bij opslaan nieuwe uren");
        }
      }

      // Update bestaande entries één voor één
      for (const entry of existingEntries) {
        await saveEntry(entry);
      }

      toast({
        title: "Succes",
        description: "Alle uren zijn opgeslagen",
      });

      await loadTimeEntries();
    } catch (error) {
      console.error("Error saving entries:", error);
      toast({
        title: "Fout",
        description: "Kon uren niet opslaan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    setCurrentWeekStart(date.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + 7);
    setCurrentWeekStart(date.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday.toISOString().split("T")[0]);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    });
  };

  const getTotalHours = () => {
    let total = 0;
    Object.values(entries).forEach((dayEntries) => {
      dayEntries.forEach((entry) => {
        total += entry.hours || 0;
      });
    });
    return total;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekoverzicht</CardTitle>
              <CardDescription>
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                disabled={loading}
              >
                Huidige week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Totaal deze week: {getTotalHours().toFixed(2)} uur
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDefaults}
              disabled={loadingDefaults}
            >
              {loadingDefaults ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Vul standaard in
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {weekDates.map((date, dayIndex) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayEntries = entries[dateStr] || [];
                const dayTotal = dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

                return (
                  <Card key={dateStr}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {weekDays[dayIndex]} {formatDate(date)}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {dayTotal > 0 ? `${dayTotal.toFixed(2)} uur` : ""}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayEntries.map((entry, entryIndex) => (
                        <div
                          key={`${dateStr}-${entryIndex}`}
                          className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg"
                        >
                          <div className="col-span-3">
                            <Label className="text-xs">Klant</Label>
                            <Select
                              value={entry.customerId}
                              onValueChange={(value) =>
                                updateEntry(dateStr, entryIndex, "customerId", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
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
                          <div className="col-span-2">
                            <Label className="text-xs">Uren</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.25"
                              value={entry.hours || ""}
                              onChange={(e) =>
                                updateEntry(
                                  dateStr,
                                  entryIndex,
                                  "hours",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-5">
                            <Label className="text-xs">Omschrijving</Label>
                            <Input
                              value={entry.description}
                              onChange={(e) =>
                                updateEntry(
                                  dateStr,
                                  entryIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Bijv. Website ontwikkeling"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label className="text-xs">Tarief</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.hourlyRate || ""}
                              onChange={(e) =>
                                updateEntry(
                                  dateStr,
                                  entryIndex,
                                  "hourlyRate",
                                  parseFloat(e.target.value) || null
                                )
                              }
                              placeholder="€"
                            />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEntry(dateStr, entryIndex)}
                            >
                              Verwijder
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEntry(dateStr)}
                        className="w-full"
                      >
                        + Regel toevoegen
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              onClick={saveAll}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                "Alle uren opslaan"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







