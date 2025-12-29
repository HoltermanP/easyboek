"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calculator } from "lucide-react";

interface IncomeTaxCalculationResult {
  profitFromBusiness: number;
  otherIncome: number;
  totalIncome: number;
  selfEmployedDeduction: number;
  smeProfitExemption: number;
  mortgageInterest: number;
  healthcareCosts: number;
  educationCosts: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBracket1: { amount: number; rate: number; tax: number };
  taxBracket2: { amount: number; rate: number; tax: number };
  taxBracket3: { amount: number; rate: number; tax: number };
  taxBracket4: { amount: number; rate: number; tax: number };
  totalTaxBeforeCredits: number;
  generalTaxCredit: number;
  employmentTaxCredit: number;
  totalCredits: number;
  finalTaxAmount: number;
  year: number;
  calculationDate: Date;
}

interface IncomeTaxCalculationProps {
  calculation: IncomeTaxCalculationResult | null;
}

export function IncomeTaxCalculation({ calculation }: IncomeTaxCalculationProps) {
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  if (!calculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inkomstenbelasting Berekening</CardTitle>
          <CardDescription>
            Vul eerst uw belastinggegevens in om de berekening te zien
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Inkomstenbelasting Berekening {calculation.year}
          </CardTitle>
          <CardDescription>
            Berekend op {new Date(calculation.calculationDate).toLocaleDateString("nl-NL")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inkomen */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Inkomen</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Winst uit onderneming</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.profitFromBusiness)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Andere inkomsten</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.otherIncome)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Totaal inkomen</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculation.totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Aftrekposten */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Aftrekposten</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Zelfstandigenaftrek</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.selfEmployedDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">MKB-winstvrijstelling</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.smeProfitExemption)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Hypotheekrente</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.mortgageInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Zorgkosten</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.healthcareCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Studiekosten</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.educationCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Overige aftrekposten</span>
                <span className="text-sm font-medium">{formatCurrency(calculation.otherDeductions)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Totaal aftrekposten</span>
                <span className="font-semibold text-red-600">{formatCurrency(calculation.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Belastbaar inkomen */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Belastbaar Inkomen</h3>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Belastbaar inkomen</span>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {formatCurrency(calculation.taxableIncome)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Belasting per schijf */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Belasting per Schijf</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schijf</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="text-right">Tarief</TableHead>
                  <TableHead className="text-right">Belasting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculation.taxBracket1.amount > 0 && (
                  <TableRow>
                    <TableCell>Schijf 1</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculation.taxBracket1.amount)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(calculation.taxBracket1.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calculation.taxBracket1.tax)}</TableCell>
                  </TableRow>
                )}
                {calculation.taxBracket2.amount > 0 && (
                  <TableRow>
                    <TableCell>Schijf 2</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculation.taxBracket2.amount)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(calculation.taxBracket2.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calculation.taxBracket2.tax)}</TableCell>
                  </TableRow>
                )}
                {calculation.taxBracket3.amount > 0 && (
                  <TableRow>
                    <TableCell>Schijf 3</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculation.taxBracket3.amount)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(calculation.taxBracket3.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calculation.taxBracket3.tax)}</TableCell>
                  </TableRow>
                )}
                {calculation.taxBracket4.amount > 0 && (
                  <TableRow>
                    <TableCell>Schijf 4</TableCell>
                    <TableCell className="text-right">{formatCurrency(calculation.taxBracket4.amount)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(calculation.taxBracket4.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calculation.taxBracket4.tax)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Totaal belasting (voor kortingen)</span>
              <span className="font-semibold">{formatCurrency(calculation.totalTaxBeforeCredits)}</span>
            </div>
          </div>

          {/* Kortingen */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kortingen</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Algemene heffingskorting</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(calculation.generalTaxCredit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Arbeidskorting</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(calculation.employmentTaxCredit)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Totaal kortingen</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculation.totalCredits)}</span>
              </div>
            </div>
          </div>

          {/* Eindbedrag */}
          <div className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {calculation.finalTaxAmount > 0 ? (
                    <TrendingDown className="h-6 w-6 text-primary" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  )}
                  <span className="text-xl font-bold">Te betalen inkomstenbelasting</span>
                </div>
                <Badge variant="default" className="text-xl px-6 py-3">
                  {formatCurrency(calculation.finalTaxAmount)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

