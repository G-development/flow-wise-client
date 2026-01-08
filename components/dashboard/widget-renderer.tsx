"use client";

import { Widget } from "@/lib/types/dashboard";
import { TotalBalanceWidget } from "./widgets/total-balance-widget";
import { PeriodIncomesWidget } from "./widgets/period-incomes-widget";
import { PeriodExpensesWidget } from "./widgets/period-expenses-widget";
import { IncomeVsExpensesWidget } from "./widgets/income-vs-expenses-widget";
import { ExpenseBreakdownWidget } from "./widgets/expense-breakdown-widget";

interface WidgetRendererProps {
  widget: Widget;
  dateFilter?: { startDate?: string; endDate?: string };
}

export function WidgetRenderer({ widget, dateFilter }: WidgetRendererProps) {
  switch (widget.type) {
    case "total-balance":
      return <TotalBalanceWidget />;
    case "period-incomes":
      return <PeriodIncomesWidget config={widget.config} dateFilter={dateFilter} />;
    case "period-expenses":
      return <PeriodExpensesWidget config={widget.config} dateFilter={dateFilter} />;
    case "income-vs-expenses":
      return <IncomeVsExpensesWidget config={widget.config} dateFilter={dateFilter} />;
    case "expense-breakdown":
      return <ExpenseBreakdownWidget config={widget.config} dateFilter={dateFilter} />;
    default:
      return (
        <div className="h-full bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Widget sconosciuto: {widget.type}</p>
        </div>
      );
  }
}
