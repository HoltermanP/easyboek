"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TrendData {
  period: string;
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

interface ReportsTrendsProps {
  trends: TrendData[];
}

export function ReportsTrends({ trends }: ReportsTrendsProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Bereken gemiddelden en trends
  const avgRevenue =
    trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length;
  const avgCosts = trends.reduce((sum, t) => sum + t.costs, 0) / trends.length;
  const avgProfit = trends.reduce((sum, t) => sum + t.profit, 0) / trends.length;

  // Bereken groei percentages
  const revenueGrowth =
    trends.length >= 2
      ? ((trends[trends.length - 1].revenue - trends[trends.length - 2].revenue) /
          trends[trends.length - 2].revenue) *
        100
      : 0;

  const profitGrowth =
    trends.length >= 2
      ? ((trends[trends.length - 1].profit - trends[trends.length - 2].profit) /
          trends[trends.length - 2].profit) *
        100
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Omzet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per maand (laatste {trends.length} maanden)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Kosten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgCosts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per maand (laatste {trends.length} maanden)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Winst</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per maand (laatste {trends.length} maanden)
            </p>
          </CardContent>
        </Card>
      </div>

      {trends.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Groei</CardTitle>
            <CardDescription>Vergelijking met vorige maand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Omzet groei</div>
                <div
                  className={`text-2xl font-bold ${
                    revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {revenueGrowth >= 0 ? "+" : ""}
                  {revenueGrowth.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Winst groei</div>
                <div
                  className={`text-2xl font-bold ${
                    profitGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {profitGrowth >= 0 ? "+" : ""}
                  {profitGrowth.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maandelijkse Trends</CardTitle>
          <CardDescription>
            Overzicht van omzet, kosten en winst per maand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Omzet</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
                <TableHead className="text-right">Winst</TableHead>
                <TableHead className="text-right">Winstmarge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trends.map((trend) => {
                const margin =
                  trend.revenue > 0 ? (trend.profit / trend.revenue) * 100 : 0;
                return (
                  <TableRow key={trend.period}>
                    <TableCell className="font-medium">{trend.month}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(trend.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(trend.costs)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        trend.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(trend.profit)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

