"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes, useExpenses } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { TruncatedNotice } from "@/components/truncated-notice";
import { totalForType } from "@/lib/amount";
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

  const { data: incomes = EMPTY_LIST_RESPONSE, isLoading: incomesLoading } = useIncomes(
    startDate,
    endDate
  );
  const { data: expenses = EMPTY_LIST_RESPONSE, isLoading: expensesLoading } = useExpenses(
    startDate,
    endDate
  );

  // Convenzione importi (lib/amount.ts): `amount` è assoluto, `type` decide il
  // segno, quindi entrambi i totali sono magnitudini positive e il segno della
  // differenza nasce dai tipi, non dai valori grezzi. I totali leggono `rows`,
  // cioè le righe effettivamente ricevute, non il campo `count` dichiarato.
  const totalIncomes = totalForType(incomes.rows, "I");
  const totalExpenses = totalForType(expenses.rows, "E");

  const truncatedShown = incomes.count + expenses.count;
  const truncatedTotal =
    incomes.total !== null && expenses.total !== null
      ? incomes.total + expenses.total
      : null;

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
    <Card className="h-full flex flex-col overflow-hidden min-h-0">
      <CardHeader className="flex-shrink-0 flex items-center p-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">
          Entrate vs Uscite
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 space-y-4 overflow-hidden flex flex-col justify-center min-h-0">
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
                  className="h-full bg-success transition-all duration-500"
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

            {(incomes.truncated || expenses.truncated) && (
              <TruncatedNotice shown={truncatedShown} total={truncatedTotal} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
