import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitAndLossData {
  period: { startDate: Date; endDate: Date };
  revenue: {
    total: number;
    bookings: number;
    breakdown: Record<string, { code: string; name: string; amount: number }>;
  };
  costs: {
    total: number;
    bookings: number;
    breakdown: Array<{ code: string; name: string; amount: number }>;
  };
  profit: {
    total: number;
    margin: number;
  };
}

interface ReportsProfitLossProps {
  pnlYear: ProfitAndLossData;
  pnlMonth: ProfitAndLossData;
}

export function ReportsProfitLoss({ pnlYear, pnlMonth }: ReportsProfitLossProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Winst & Verlies - Dit Jaar</CardTitle>
            <CardDescription>
              {format(pnlYear.period.startDate, "d MMM yyyy", { locale: nl })} -{" "}
              {format(pnlYear.period.endDate, "d MMM yyyy", { locale: nl })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Omzet</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(pnlYear.revenue.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Kosten</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(pnlYear.costs.total)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-base font-bold">Winst/Verlies</span>
                <span
                  className={`text-base font-bold ${
                    pnlYear.profit.total >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(pnlYear.profit.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Winstmarge</span>
                <span>{pnlYear.profit.margin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Winst & Verlies - Deze Maand</CardTitle>
            <CardDescription>
              {format(pnlMonth.period.startDate, "d MMM yyyy", { locale: nl })} -{" "}
              {format(pnlMonth.period.endDate, "d MMM yyyy", { locale: nl })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Omzet</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(pnlMonth.revenue.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Kosten</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(pnlMonth.costs.total)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-base font-bold">Winst/Verlies</span>
                <span
                  className={`text-base font-bold ${
                    pnlMonth.profit.total >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(pnlMonth.profit.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Winstmarge</span>
                <span>{pnlMonth.profit.margin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kosten Breakdown - Dit Jaar</CardTitle>
          <CardDescription>Top kostenposten gesorteerd op bedrag</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rekening</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pnlYear.costs.breakdown.length > 0 ? (
                pnlYear.costs.breakdown.map((item) => {
                  const percentage =
                    pnlYear.costs.total > 0
                      ? (item.amount / pnlYear.costs.total) * 100
                      : 0;
                  return (
                    <TableRow key={item.code}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen kosten dit jaar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Omzet Breakdown - Dit Jaar</CardTitle>
          <CardDescription>Omzet per rekening</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rekening</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(pnlYear.revenue.breakdown).length > 0 ? (
                Object.values(pnlYear.revenue.breakdown)
                  .sort((a, b) => b.amount - a.amount)
                  .map((item) => {
                    const percentage =
                      pnlYear.revenue.total > 0
                        ? (item.amount / pnlYear.revenue.total) * 100
                        : 0;
                    return (
                      <TableRow key={item.code}>
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen omzet dit jaar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

