import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { CheckCircle2, XCircle } from "lucide-react";

interface BalanceSheetData {
  date: Date;
  activa: {
    items: Array<{
      code: string;
      name: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    total: number;
  };
  passiva: {
    items: Array<{
      code: string;
      name: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
    total: number;
  };
  eigenVermogen: {
    amount: number;
  };
  total: {
    activa: number;
    passiva: number;
    balanced: boolean;
  };
}

interface ReportsBalanceSheetProps {
  balanceSheet: BalanceSheetData;
}

export function ReportsBalanceSheet({ balanceSheet }: ReportsBalanceSheetProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Balans</CardTitle>
          <CardDescription>
            Per {format(balanceSheet.date, "d MMMM yyyy", { locale: nl })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {balanceSheet.total.balanced ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  Balans is in evenwicht
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-600 font-medium">
                  Balans is niet in evenwicht (verschil:{" "}
                  {formatCurrency(
                    Math.abs(balanceSheet.total.activa - balanceSheet.total.passiva)
                  )}
                  )
                </span>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-3">Activa</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rekening</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceSheet.activa.items.length > 0 ? (
                    balanceSheet.activa.items.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Geen activa
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>Totaal Activa</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(balanceSheet.activa.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Passiva</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rekening</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceSheet.passiva.items.length > 0 ? (
                    balanceSheet.passiva.items.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell className="font-mono">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Geen passiva
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-semibold">
                    <TableCell className="font-mono">2000</TableCell>
                    <TableCell>Eigen Vermogen</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(balanceSheet.eigenVermogen.amount)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={2}>Totaal Passiva</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(balanceSheet.total.passiva)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

