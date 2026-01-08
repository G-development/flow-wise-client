"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses, useCategories, type Transaction, type Category } from "@/lib/hooks/useQueries";
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

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(
    startDate,
    endDate
  );
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

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

    expenses.forEach((expense: Transaction) => {
      const categoryKey = String(expense.category_id);
      const categoryName = categoryMap[categoryKey] || "Uncategorized";
      const amount = typeof expense.amount === "number" ? expense.amount : 0;
      grouped[categoryName] = (grouped[categoryName] || 0) + amount;
    });

    return grouped;
  }, [expenses, categoryMap]);

  // Format data for pie chart
  const chartData = useMemo(() => {
    return Object.entries(expensesByCategory).map(([category, amount], index: number) => ({
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

  const totalExpenses = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const formatCurrency = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });

  const isLoading = expensesLoading || categoriesLoading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs sm:text-sm font-medium">
          Spese per Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            No expenses in this period
          </div>
        ) : (
          <div className="w-full space-y-3">
            {/* Pie Chart */}
            <ChartContainer config={chartConfig} className="w-full aspect-square max-h-[200px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item, _index, payload) => (
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
            <ScrollArea className="h-36 w-full">
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

            {/* Total */}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-xs font-medium">Totale</span>
              <span className="text-xs font-bold">
                {formatCurrency.format(totalExpenses)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
