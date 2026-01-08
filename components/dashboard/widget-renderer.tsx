"use client";

import { Widget } from "@/lib/types/dashboard";
import { TotalBalanceWidget } from "./widgets/total-balance-widget";
import { PeriodIncomesWidget } from "./widgets/period-incomes-widget";

interface WidgetRendererProps {
  widget: Widget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case "total-balance":
      return <TotalBalanceWidget />;
    case "period-incomes":
      return <PeriodIncomesWidget config={widget.config} />;
    default:
      return (
        <div className="h-full bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Widget sconosciuto: {widget.type}</p>
        </div>
      );
  }
}
