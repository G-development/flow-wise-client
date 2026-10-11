"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { TruncatedNotice } from "@/components/truncated-notice";
import { totalForType } from "@/lib/amount";
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

  const { data: incomes = EMPTY_LIST_RESPONSE, isLoading } = useIncomes(startDate, endDate);

  // Convenzione importi (lib/amount.ts): `amount` è assoluto, `type` decide il
  // segno. Il totale non somma mai il valore grezzo. Sommiamo `rows`, cioè lo
  // stesso insieme di righe che il server ha contato: quando `truncated` è true
  // l'insieme è incompleto e il totale va presentato come parziale.
  const totalIncomes = totalForType(incomes.rows, "I");

  const formatCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md flex flex-col overflow-hidden min-h-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Period Incomes</CardTitle>
        <div className="rounded-xl bg-success/10 p-2.5">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 space-y-2 overflow-hidden flex flex-col justify-center min-h-0">
        {isLoading ? (
          <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-success">
            +{incomes.truncated ? "≥ " : ""}
            {formatCurrency.format(totalIncomes)}
          </div>
        )}
        {incomes.truncated ? (
          <TruncatedNotice shown={incomes.count} total={incomes.total} />
        ) : (
          <p className="text-xs text-muted-foreground">
            {incomes.rows.length} {incomes.rows.length === 1 ? 'transaction' : 'transactions'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
