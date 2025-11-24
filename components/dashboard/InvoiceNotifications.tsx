import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import {
  getOverdueInvoices,
  getUpcomingDueInvoices,
  getTotalOutstanding,
} from "@/services/notifications/invoices";

interface InvoiceNotificationsProps {
  companyId: string;
}

export async function InvoiceNotifications({
  companyId,
}: InvoiceNotificationsProps) {
  const [overdue, upcoming, outstanding] = await Promise.all([
    getOverdueInvoices(companyId),
    getUpcomingDueInvoices(companyId, 7),
    getTotalOutstanding(companyId),
  ]);

  if (overdue.length === 0 && upcoming.length === 0 && outstanding.count === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const daysOverdue = (dueDate: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Vervallen Facturen</AlertTitle>
          <AlertDescription>
            U heeft {overdue.length} vervallen factuur{overdue.length !== 1 ? "en" : ""} met een totaal bedrag van{" "}
            {formatCurrency(
              overdue.reduce((sum, inv) => sum + Number(inv.total), 0)
            )}
            .
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Factuur Overzicht</CardTitle>
          <CardDescription>
            Openstaande en vervallen facturen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Totaal Openstaand</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(outstanding.total)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {outstanding.count} factuur{outstanding.count !== 1 ? "en" : ""}
              </div>
            </div>
          </div>

          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-600">
                  Vervallen ({overdue.length})
                </h3>
              </div>
              <div className="space-y-2">
                {overdue.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{invoice.number}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.name} •{" "}
                        {format(invoice.dueDate, "d MMM yyyy", { locale: nl })}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {daysOverdue(invoice.dueDate)} dag
                        {daysOverdue(invoice.dueDate) !== 1 ? "en" : ""} te laat
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(Number(invoice.total))}
                      </div>
                    </div>
                  </div>
                ))}
                {overdue.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center">
                    +{overdue.length - 5} meer vervallen facturen
                  </div>
                )}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-amber-600">
                  Vervalt Binnenkort ({upcoming.length})
                </h3>
              </div>
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{invoice.number}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer.name} •{" "}
                        {format(invoice.dueDate, "d MMM yyyy", { locale: nl })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(Number(invoice.total))}
                      </div>
                    </div>
                  </div>
                ))}
                {upcoming.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center">
                    +{upcoming.length - 5} meer facturen
                  </div>
                )}
              </div>
            </div>
          )}

          <Button asChild className="w-full">
            <Link href="/dashboard/invoices">Bekijk Alle Facturen</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

