"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Receipt, 
  Calendar, 
  TrendingUp, 
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";

interface FinancialAdviceProps {
  hasOverdueInvoices: boolean;
  hasUpcomingInvoices: boolean;
  outstandingAmount: number;
  profitThisYear: number;
  hasOpenVatPeriod: boolean;
}

export function FinancialAdvice({
  hasOverdueInvoices,
  hasUpcomingInvoices,
  outstandingAmount,
  profitThisYear,
  hasOpenVatPeriod,
}: FinancialAdviceProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const adviceItems = [];

  // Advies over openstaande facturen
  if (hasOverdueInvoices) {
    adviceItems.push({
      icon: AlertTriangle,
      title: "Vervallen facturen",
      description: "U heeft facturen die al vervallen zijn. Neem contact op met uw klanten om deze te innen.",
      priority: "high",
      color: "red",
    });
  }

  if (hasUpcomingInvoices && outstandingAmount > 0) {
    adviceItems.push({
      icon: Calendar,
      title: "Facturen vervallen binnenkort",
      description: `U heeft binnenkort facturen ter waarde van ${formatCurrency(outstandingAmount)} die betaald moeten worden. Zorg dat u hierop voorbereid bent.`,
      priority: "medium",
      color: "amber",
    });
  }

  // Advies over BTW aangifte
  if (hasOpenVatPeriod) {
    adviceItems.push({
      icon: FileText,
      title: "BTW-aangifte",
      description: "U heeft een open BTW-periode. Zorg dat u alle facturen en bonnetjes heeft geboekt voordat u de aangifte indient.",
      priority: "medium",
      color: "blue",
    });
  }

  // Algemeen advies over administratie
  adviceItems.push({
    icon: Receipt,
    title: "Houd uw administratie bij",
    description: "Boek alle bonnetjes en facturen direct in het systeem. Dit bespaart u veel tijd aan het einde van het kwartaal.",
    priority: "low",
    color: "green",
  });

  // Advies over reserveringen
  adviceItems.push({
    icon: Shield,
    title: "Reserveer voor belastingen",
    description: "Zet elke maand een deel van uw omzet apart voor BTW en inkomstenbelasting. Zo voorkomt u verrassingen.",
    priority: "low",
    color: "blue",
  });

  // Advies over winst
  if (profitThisYear > 0) {
    adviceItems.push({
      icon: TrendingUp,
      title: "Goede winst dit jaar",
      description: `U heeft dit jaar een winst van ${formatCurrency(profitThisYear)}. Vergeet niet om hier belasting over te reserveren (ongeveer 40-50%).`,
      priority: "low",
      color: "green",
    });
  }

  // Sorteer op prioriteit
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  adviceItems.sort((a, b) => (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0));

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-900">Financiële Adviezen</CardTitle>
        </div>
        <CardDescription>
          Handige tips voor uw financiën en belastingen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {adviceItems.length === 0 ? (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Alles op orde!</AlertTitle>
            <AlertDescription>
              Uw administratie ziet er goed uit. Blijf alle bonnetjes en facturen bijhouden.
            </AlertDescription>
          </Alert>
        ) : (
          adviceItems.map((item, index) => {
            const Icon = item.icon;
            const colorClasses: Record<string, string> = {
              red: "border-red-200 bg-red-50/50",
              amber: "border-amber-200 bg-amber-50/50",
              blue: "border-blue-200 bg-blue-50/50",
              green: "border-green-200 bg-green-50/50",
            };

            return (
              <Alert key={index} className={colorClasses[item.color] || colorClasses.blue}>
                <Icon className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {item.title}
                  {item.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">
                      Belangrijk
                    </Badge>
                  )}
                  {item.priority === "medium" && (
                    <Badge variant="outline" className="text-xs bg-amber-100">
                      Aandacht
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription>{item.description}</AlertDescription>
              </Alert>
            );
          })
        )}

        {/* Algemene tips sectie */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Algemene tips voor ZZP'ers:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Houd altijd een buffer aan van minimaal 3 maanden aan vaste lasten</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Betaal uzelf een vast maandelijks salaris, niet alles wat er binnenkomt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Maak gebruik van de zelfstandigenaftrek en MKB-winstvrijstelling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Bewaar alle bonnetjes en facturen minimaal 7 jaar (wettelijke bewaarplicht)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Overweeg een aparte zakelijke rekening voor betere overzicht</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

