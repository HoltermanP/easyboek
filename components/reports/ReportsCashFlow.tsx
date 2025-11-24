import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface CashFlowData {
  period: { startDate: Date; endDate: Date };
  operating: {
    cashIn: number;
    cashOut: number;
    netFlow: number;
  };
  breakdown: {
    inflows: Array<{
      date: Date;
      description: string;
      amount: number;
      account: string;
    }>;
    outflows: Array<{
      date: Date;
      description: string;
      amount: number;
      account: string;
    }>;
  };
}

interface ReportsCashFlowProps {
  cashFlow: CashFlowData;
}

export function ReportsCashFlow({ cashFlow }: ReportsCashFlowProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cashFlow.operating.cashIn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inkomsten uit operaties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(cashFlow.operating.cashOut)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uitgaven uit operaties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Netto Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                cashFlow.operating.netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(cashFlow.operating.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cashFlow.operating.netFlow >= 0 ? "Positief" : "Negatief"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Inflows</CardTitle>
          <CardDescription>
            Inkomsten in de periode{" "}
            {format(cashFlow.period.startDate, "d MMM yyyy", { locale: nl })} -{" "}
            {format(cashFlow.period.endDate, "d MMM yyyy", { locale: nl })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlow.breakdown.inflows.length > 0 ? (
                cashFlow.breakdown.inflows.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {format(item.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.account}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen inkomsten in deze periode
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Outflows</CardTitle>
          <CardDescription>
            Uitgaven in de periode{" "}
            {format(cashFlow.period.startDate, "d MMM yyyy", { locale: nl })} -{" "}
            {format(cashFlow.period.endDate, "d MMM yyyy", { locale: nl })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlow.breakdown.outflows.length > 0 ? (
                cashFlow.breakdown.outflows.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {format(item.date, "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.account}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Geen uitgaven in deze periode
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

