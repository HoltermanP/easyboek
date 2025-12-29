"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QuarterlyReservationAdvice } from "@/services/tax/reservationAdvice";
import { Info, PiggyBank, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

interface QuarterlyVatAdviceProps {
  advice: QuarterlyReservationAdvice;
}

export function QuarterlyVatAdvice({ advice }: QuarterlyVatAdviceProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const progress = advice.progress;
  const vatAdvice = advice.vatReservation;
  
  // Bepaal status
  const isOnTrack = progress.shouldHaveReservedByNow <= vatAdvice.recommendedReservation;
  const difference = vatAdvice.recommendedReservation - progress.shouldHaveReservedByNow;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">BTW Reserveringsadvies voor dit Kwartaal</CardTitle>
        </div>
        <CardDescription>
          {format(advice.period.startDate, "d MMMM", { locale: nl })} -{" "}
          {format(advice.period.endDate, "d MMMM yyyy", { locale: nl })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Uitleg voor leken */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Wat betekent dit?</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Als ZZP'er moet u BTW betalen over uw verkopen. Het is verstandig om dit bedrag 
              apart te reserveren op een spaarrekening, zodat u altijd genoeg geld heeft om uw 
              BTW-aangifte te betalen.
            </p>
            <p className="font-semibold">
              Reserveer dit bedrag op een aparte spaarrekening en gebruik het niet voor andere uitgaven!
            </p>
          </AlertDescription>
        </Alert>

        {/* Hoofdcijfers */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Totaal te reserveren voor kwartaal */}
          <div className="p-4 bg-white rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Totaal te reserveren dit kwartaal</h3>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Volledig kwartaal
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>BTW verschuldigd:</span>
                <span className="font-medium">
                  {formatCurrency(vatAdvice.totalVatOwed)}
                </span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-blue-700 pt-2">
                <span>Te reserveren:</span>
                <span>{formatCurrency(vatAdvice.recommendedReservation)}</span>
              </div>
            </div>
          </div>

          {/* Al gereserveerd moeten zijn */}
          <div className={`p-4 rounded-lg border-2 ${
            isOnTrack 
              ? "bg-green-50 border-green-300" 
              : "bg-amber-50 border-amber-300"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Nu al gereserveerd moeten zijn</h3>
              {isOnTrack ? (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Op schema
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Aandacht nodig
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Kwartaal verstreken:</span>
                <span className="font-medium">
                  {Math.round(progress.percentageElapsed)}% ({progress.daysElapsed} van {progress.daysTotal} dagen)
                </span>
              </div>
              <div className={`flex justify-between text-2xl font-bold pt-2 ${
                isOnTrack ? "text-green-700" : "text-amber-700"
              }`}>
                <span>Nu reserveren:</span>
                <span>{formatCurrency(progress.shouldHaveReservedByNow)}</span>
              </div>
              {!isOnTrack && (
                <div className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200">
                  U loopt achter met reserveren. Probeer dit bedrag zo snel mogelijk apart te zetten.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progressie indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Voortgang kwartaal</span>
            <span className="font-medium">{Math.round(progress.percentageElapsed)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress.percentageElapsed}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{format(advice.period.startDate, "d MMM", { locale: nl })}</span>
            <span>Vandaag</span>
            <span>{format(advice.period.endDate, "d MMM", { locale: nl })}</span>
          </div>
        </div>

        {/* Praktische tip */}
        <Alert className="bg-blue-50 border-blue-200">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Praktische tip</AlertTitle>
          <AlertDescription className="text-blue-800">
            Zet elke keer dat u een factuur betaald krijgt, direct het BTW-bedrag apart op een 
            spaarrekening. Zo voorkomt u dat u aan het einde van het kwartaal voor verrassingen komt te staan.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

