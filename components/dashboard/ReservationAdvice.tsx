import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ReservationAdvice as ReservationAdviceType } from "@/services/tax/reservationAdvice";
import { Info, PiggyBank, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";

interface ReservationAdviceProps {
  advice: ReservationAdviceType;
  paidInvoicesThisMonth: number;
}

export function ReservationAdvice({
  advice,
  paidInvoicesThisMonth,
}: ReservationAdviceProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Toon alleen als er betaalde facturen zijn en er een reservering nodig is
  if (paidInvoicesThisMonth === 0 || advice.totalReservation === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">Reserveringsadvies</CardTitle>
        </div>
        <CardDescription>
          Advies voor reservering op spaarrekening voor belastingen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Belangrijk</AlertTitle>
          <AlertDescription>
            Reserveer dit bedrag op een aparte spaarrekening om te voorkomen dat u
            problemen krijgt bij het betalen van uw belastingen.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          {/* BTW Reservering */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">BTW Reservering</h3>
              <Badge variant="outline" className="bg-blue-100">
                {advice.vatReservation.percentage}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BTW verschuldigd:</span>
                <span className="font-medium">
                  {formatCurrency(advice.vatReservation.totalVatOwed)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-700">
                <span>Te reserveren:</span>
                <span>{formatCurrency(advice.vatReservation.recommendedReservation)}</span>
              </div>
            </div>
          </div>

          {/* Inkomstenbelasting Reservering */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Inkomstenbelasting Reservering</h3>
              <Badge variant="outline" className="bg-blue-100">
                {advice.incomeTaxReservation.percentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Geschatte belasting:</span>
                <span className="font-medium">
                  {formatCurrency(advice.incomeTaxReservation.estimatedTax)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-700">
                <span>Te reserveren:</span>
                <span>
                  {formatCurrency(advice.incomeTaxReservation.recommendedReservation)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Totaal Reservering */}
        <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
              <span className="font-semibold text-blue-900">Totaal te reserveren:</span>
            </div>
            <span className="text-2xl font-bold text-blue-900">
              {formatCurrency(advice.totalReservation)}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            Periode: {format(advice.period.startDate, "d MMM", { locale: nl })} -{" "}
            {format(advice.period.endDate, "d MMM yyyy", { locale: nl })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}








