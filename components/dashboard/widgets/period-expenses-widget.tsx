"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses } from "@/lib/hooks/useQueries";
import { TrendingDown } from "lucide-react";
import { WidgetConfig } from "@/lib/types/dashboard";
import { useMemo } from "react";

interface PeriodExpensesWidgetProps {
  config?: WidgetConfig;
  dateFilter?: { startDate?: string; endDate?: string };
}

export function PeriodExpensesWidget({ config, dateFilter }: PeriodExpensesWidgetProps) {
  const defaultEndDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const startDate = dateFilter?.startDate || config?.startDate || defaultStartDate;
  const endDate = dateFilter?.endDate || config?.endDate || defaultEndDate;

  const { data: expenses = [], isLoading } = useExpenses(startDate, endDate);

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = typeof expense.amount === "number" ? expense.amount : 0;
    return sum + amount;
  }, 0);

  const formatCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md min-h-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Period Expenses</CardTitle>
        <div className="rounded-xl bg-destructive/10 p-2.5">
          <TrendingDown className="h-4 w-4 text-destructive" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 space-y-2 overflow-hidden flex flex-col justify-center min-h-0">
        {isLoading ? (
          <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-destructive">
            {formatCurrency.format(totalExpenses)}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
        </p>
      </CardContent>
    </Card>
  );
}
