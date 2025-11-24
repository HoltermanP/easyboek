import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import {
  calculateProfitAndLoss,
  calculateBalanceSheet,
  calculateCashFlow,
  calculateTrends,
} from "@/services/reports/reports";
import { ReportsProfitLoss } from "@/components/reports/ReportsProfitLoss";
import { ReportsBalanceSheet } from "@/components/reports/ReportsBalanceSheet";
import { ReportsCashFlow } from "@/components/reports/ReportsCashFlow";
import { ReportsTrends } from "@/components/reports/ReportsTrends";

async function getCompany(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      companies: true,
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  return user.companies[0];
}

export default async function ReportsPage() {
  const user = await requireAuth();
  const company = await getCompany(user.clerkId);

  if (!company) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rapportages</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen bedrijf gevonden</CardTitle>
            <CardDescription>
              Maak eerst een bedrijf aan om rapportages te bekijken.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Standaard periodes
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Haal rapportages op
  const [pnlYear, pnlMonth, balanceSheet, cashFlow, trends] = await Promise.all([
    calculateProfitAndLoss(company.id, startOfYear, endOfYear),
    calculateProfitAndLoss(company.id, startOfMonth, endOfMonth),
    calculateBalanceSheet(company.id, now),
    calculateCashFlow(company.id, startOfYear, endOfYear),
    calculateTrends(company.id, 12),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rapportages</h1>
        <p className="text-muted-foreground">
          Financiële overzichten en analyses voor {company.name}
        </p>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">Winst & Verlies</TabsTrigger>
          <TabsTrigger value="balance">Balans</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-4">
          <ReportsProfitLoss pnlYear={pnlYear} pnlMonth={pnlMonth} />
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <ReportsBalanceSheet balanceSheet={balanceSheet} />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <ReportsCashFlow cashFlow={cashFlow} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ReportsTrends trends={trends} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

