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
  // Default: ultimi 30 giorni
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

  const formatCurrency = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });

  const periodLabel = startDate && endDate
    ? `Dal ${new Date(startDate).toLocaleDateString("it-IT")}` +
      ` al ${new Date(endDate).toLocaleDateString("it-IT")}`
    : "Ultimi 30 giorni";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate">Entrate del Periodo</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-xl sm:text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <div className="text-xl sm:text-2xl font-bold text-green-600 truncate">
            +{formatCurrency.format(totalIncomes)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {incomes.length} transazioni • {periodLabel}
        </p>
      </CardContent>
    </Card>
  );
}
