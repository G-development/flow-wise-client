"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { BarChart3, PieChart, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Widget, WidgetType, GRID_COLS, GRID_ROWS } from "@/lib/types/dashboard";

interface AddWidgetDialogProps {
  existingWidgets: Widget[];
  onAddWidget: (widget: Widget) => void;
}

const AVAILABLE_WIDGETS: Array<{
  type: WidgetType;
  label: string;
  description: string;
}> = [
  {
    type: "total-balance",
    label: "Total Balance",
    description: "Display your total wallet balance",
  },
  {
    type: "period-incomes",
    label: "Period Incomes",
    description: "Show your income for a selected period",
  },
  {
    type: "period-expenses",
    label: "Period Expenses",
    description: "Show your expenses for a selected period",
  },
  {
    type: "income-vs-expenses",
    label: "Income vs Expenses",
    description: "Visual comparison between income and expenses",
  },
  {
    type: "expense-breakdown",
    label: "Expense Breakdown",
    description: "Pie chart of expenses by category",
  },
];

const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  "total-balance": Wallet,
  "period-incomes": TrendingUp,
  "period-expenses": TrendingDown,
  "income-vs-expenses": BarChart3,
  "expense-breakdown": PieChart,
};

export function AddWidgetDialog({
  existingWidgets,
  onAddWidget,
}: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false);

  const handleAddWidget = (type: WidgetType) => {
    // Trova una posizione disponibile per il nuovo widget
    const newPosition = findAvailablePosition(existingWidgets);
    
    if (!newPosition) {
      alert("No available space for new widget. Please remove a widget first.");
      return;
    }

    const newWidget: Widget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: newPosition,
    };

    onAddWidget(newWidget);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add widget</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Select a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {AVAILABLE_WIDGETS.map((widget) => (
            // Small visual cue per widget type
            <button
              key={widget.type}
              onClick={() => handleAddWidget(widget.type)}
              className="w-full text-left p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  {(() => {
                    const Icon = WIDGET_ICONS[widget.type];
                    return <Icon className="h-5 w-5" aria-hidden />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{widget.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {widget.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to find first available position
function findAvailablePosition(
  existingWidgets: Widget[]
): { x: number; y: number; w: number; h: number } | null {
  const defaultSize = { w: 2, h: 1 };

  // Prova a trovare uno spazio 2x1
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x <= GRID_COLS - defaultSize.w; x++) {
      const position = { x, y, ...defaultSize };
      
      // Controlla se questa posizione è disponibile
      const isAvailable = !existingWidgets.some((widget) => {
        const overlapsX =
          position.x < widget.position.x + widget.position.w &&
          position.x + position.w > widget.position.x;
        const overlapsY =
          position.y < widget.position.y + widget.position.h &&
          position.y + position.h > widget.position.y;
        return overlapsX && overlapsY;
      });

      if (isAvailable) {
        return position;
      }
    }
  }

  return null;
}
