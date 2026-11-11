"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses, useCategories, type Transaction, type Category } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { TruncatedNotice } from "@/components/truncated-notice";
import { absoluteAmount, isRefund, totalForType } from "@/lib/amount";
import { WidgetConfig } from "@/lib/types/dashboard";
import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pie, PieChart } from "recharts";

interface ExpenseBreakdownWidgetProps {
  config?: WidgetConfig;
  dateFilter?: { startDate?: string; endDate?: string };
}

// Color palette for categories
const CATEGORY_COLORS: { [key: string]: string } = {
  0: "#ef4444", // red
  1: "#f97316", // orange
  2: "#eab308", // yellow
  3: "#22c55e", // green
  4: "#06b6d4", // cyan
  5: "#3b82f6", // blue
  6: "#8b5cf6", // purple
  7: "#ec4899", // pink
};

export function ExpenseBreakdownWidget({
  config,
  dateFilter,
}: ExpenseBreakdownWidgetProps) {
  // Default: ultimi 30 giorni
  const defaultEndDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const startDate = dateFilter?.startDate || config?.startDate || defaultStartDate;
  const endDate = dateFilter?.endDate || config?.endDate || defaultEndDate;

  const { data: expenses = EMPTY_LIST_RESPONSE, isLoading: expensesLoading } = useExpenses(
    startDate,
    endDate
  );
  const { data: categoryList = EMPTY_LIST_RESPONSE, isLoading: categoriesLoading } =
    useCategories();
  // La risposta e' l'envelope di lista: le righe stanno in `rows`.
  const categories = categoryList.rows;

  // Righe effettivamente ricevute: il grafico e il totale leggono queste, mai il
  // `count` dichiarato dal server (che puo' essere maggiore di `rows.length`
  // quando il set e' troncato).
  const expenseRows = expenses.rows;

  // Create a map of category_id to category name
  const categoryMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    categories.forEach((cat: Category) => {
      map[String(cat.id)] = cat.name;
    });
    return map;
  }, [categories]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped: { [key: string]: number } = {};

    expenseRows.forEach((expense: Transaction) => {
      const categoryKey = String(expense.category_id);
      const categoryName = categoryMap[categoryKey] || "Uncategorized";
      // Convenzione importi (lib/amount.ts): la magnitudine si legge da `amount`,
      // il segno da `type`. Qui le fette del grafico sono magnitudini.
      // Un rimborso (fase 5) e' una spesa in meno della sua categoria.
      const amount = isRefund(expense) ? -absoluteAmount(expense.amount) : absoluteAmount(expense.amount);
      grouped[categoryName] = (grouped[categoryName] || 0) + amount;
    });

    return grouped;
  }, [expenseRows, categoryMap]);

  // Format data for pie chart
  const chartData = useMemo(() => {
    // Una categoria con piu' rimborsi che spese nel periodo (es. il condominio rimborsato il
    // mese dopo) non ha una fetta: il totale sotto resta comunque il netto vero.
    return Object.entries(expensesByCategory)
      .filter(([, amount]) => amount > 0.005)
      .map(([category, amount], index: number) => ({
      category,
      value: amount,
      fill: CATEGORY_COLORS[index % Object.keys(CATEGORY_COLORS).length],
    }));
  }, [expensesByCategory]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    chartData.forEach((item) => {
      config[item.category] = {
        label: item.category,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);

  // Barre (mobile): stesse categorie e colori della torta, dalla piu' alta; la piu' alta riempie la riga.
  const barData = useMemo(() => [...chartData].sort((a, b) => b.value - a.value), [chartData]);
  const maxValue = barData[0]?.value ?? 0;

  // Totale netto di tutte le categorie (anche quelle senza fetta), come gli altri widget.
  const totalExpenses = useMemo(() => totalForType(expenseRows, "E"), [expenseRows]);

  const formatCurrency = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });

  const isLoading = expensesLoading || categoriesLoading;

  return (
    <Card className="h-full flex flex-col overflow-hidden min-h-0">
      <CardHeader className="flex-shrink-0 p-4 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">
          Spese per Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 overflow-hidden flex flex-col items-center justify-center min-h-0">
        {isLoading ? (
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            No expenses in this period
          </div>
        ) : (
          <div className="w-full space-y-3">
            {/* Mobile (stessa soglia di dashboard-grid, 768 px): barre orizzontali dalla categoria piu'
                alta, piu' leggibili della torta su uno schermo stretto (U6, deciso da Gio il 10/11). */}
            <ul className="space-y-2.5 md:hidden" aria-label="Spese per categoria">
              {barData.map((item) => (
                <li key={item.category} className="text-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate">{item.category}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatCurrency.format(item.value)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${maxValue > 0 ? Math.max(2, (item.value / maxValue) * 100) : 0}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden space-y-3 md:block">
            {/* Pie Chart */}
            <ChartContainer config={chartConfig} className="w-full aspect-square max-h-[200px] shrink-0">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, _item, _index, payload) => (
                        <div className="flex w-full justify-between">
                          <span className="text-muted-foreground mr-3">
                            {(payload as { category?: string })?.category || name}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrency.format(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={40}
                  outerRadius={70}
                  strokeWidth={0}
                />
              </PieChart>
            </ChartContainer>

            {/* Legend (scrollable to avoid oversized widget) */}
            <ScrollArea className="flex-1 min-h-0 w-full">
              <div className="space-y-1 text-xs pr-2">
                {chartData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="truncate">{item.category}</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency.format(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            </div>

            {/* Total */}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-xs font-medium">Totale</span>
              <span className="text-xs font-bold">
                {expenses.truncated ? "≥ " : ""}
                {formatCurrency.format(totalExpenses)}
              </span>
            </div>

            {expenses.truncated && (
              <TruncatedNotice shown={expenses.count} total={expenses.total} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
