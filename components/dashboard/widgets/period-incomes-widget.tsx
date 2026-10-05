"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes } from "@/lib/hooks/useQueries";
import { TrendingUp } from "lucide-react";
import { WidgetConfig } from "@/lib/types/dashboard";
import { useMemo } from "react";

interface PeriodIncomesWidgetProps {
  config?: WidgetConfig;
  dateFilter?: { startDate?: string; endDate?: string };
}

export function PeriodIncomesWidget({ config, dateFilter }: PeriodIncomesWidgetProps) {
  const defaultEndDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const startDate = dateFilter?.startDate || config?.startDate || defaultStartDate;
  const endDate = dateFilter?.endDate || config?.endDate || defaultEndDate;

  const { data: incomes = [], isLoading } = useIncomes(startDate, endDate);

  const totalIncomes = incomes.reduce((sum, income) => {
    const amount = typeof income.amount === "number" ? income.amount : 0;
    return sum + amount;
  }, 0);

  const formatCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">Period Incomes</CardTitle>
        <div className="rounded-xl bg-success/10 p-2.5">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-success">
            +{formatCurrency.format(totalIncomes)}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {incomes.length} {incomes.length === 1 ? 'transaction' : 'transactions'}
        </p>
      </CardContent>
    </Card>
  );
}
