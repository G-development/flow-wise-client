"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes, useExpenses } from "@/lib/hooks/useQueries";
import { WidgetConfig } from "@/lib/types/dashboard";
import { useMemo } from "react";

interface IncomeVsExpensesWidgetProps {
  config?: WidgetConfig;
  dateFilter?: { startDate?: string; endDate?: string };
}

export function IncomeVsExpensesWidget({
  config,
  dateFilter,
}: IncomeVsExpensesWidgetProps) {
  // Default: ultimi 30 giorni
  const defaultEndDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const startDate = dateFilter?.startDate || config?.startDate || defaultStartDate;
  const endDate = dateFilter?.endDate || config?.endDate || defaultEndDate;

  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(
    startDate,
    endDate
  );
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(
    startDate,
    endDate
  );

  const totalIncomes = incomes.reduce((sum, income) => {
    const amount = typeof income.amount === "number" ? income.amount : 0;
    return sum + amount;
  }, 0);

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = typeof expense.amount === "number" ? expense.amount : 0;
    return sum + amount;
  }, 0);

  const difference = totalIncomes - totalExpenses;
  const maxValue = Math.max(totalIncomes, totalExpenses) || 1;

  const incomePercentage = (totalIncomes / maxValue) * 100;
  const expensePercentage = (totalExpenses / maxValue) * 100;

  const formatCurrency = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });

  const isLoading = incomesLoading || expensesLoading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs sm:text-sm font-medium">
          Entrate vs Uscite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* Income Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Entrate</span>
                <span className="text-xs font-semibold text-green-600">
                  +{formatCurrency.format(totalIncomes)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${incomePercentage}%` }}
                />
              </div>
            </div>

            {/* Expense Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Uscite</span>
                <span className="text-xs font-semibold text-red-600">
                  -{formatCurrency.format(totalExpenses)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${expensePercentage}%` }}
                />
              </div>
            </div>

            {/* Difference */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Bilancio</span>
                <span
                  className={`text-xs font-bold ${
                    difference >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {difference >= 0 ? "+" : ""}
                  {formatCurrency.format(difference)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
