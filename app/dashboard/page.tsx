"use client";

import Navbar from "@/components/navbar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog";
import { useDashboardLayout, useSaveDashboardLayout } from "@/lib/hooks/useQueries";
import { DEFAULT_LAYOUT, Widget } from "@/lib/types/dashboard";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import DatePickerWithRange from "@/components/date-picker";
import { useDateRange } from "@/lib/providers/DateRangeProvider";
import { Button } from "@/components/ui/button";
import NewTransaction from "@/components/new-transaction";
import { Edit2, Check, Plus } from "lucide-react";

export default function Dashboard() {
  const { data: layoutData, isLoading } = useDashboardLayout();
  const saveLayout = useSaveDashboardLayout();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { dateRange, setDateRange } = useDateRange();

  const startDateStr = dateRange?.from?.toISOString().split("T")[0];
  const endDateStr = dateRange?.to?.toISOString().split("T")[0];

  // Inizializza widgets da server o usa default
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (layoutData?.widgets && layoutData.widgets.length > 0) {
        setWidgets(layoutData.widgets);
      } else {
        // Se non c'è layout o è vuoto, usa default
        setWidgets(DEFAULT_LAYOUT);
      }
      setInitialized(true);
    }
  }, [layoutData, isLoading, initialized]);

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    setWidgets(updatedWidgets);
    // Salva automaticamente al drag end
    saveLayout.mutate(updatedWidgets);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter((w) => w.id !== widgetId);
    setWidgets(updatedWidgets);
    saveLayout.mutate(updatedWidgets);
  };

  const handleAddWidget = (newWidget: Widget) => {
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveLayout.mutate(updatedWidgets);
  };

  const handleSaveEdit = () => {
    saveLayout.mutate(widgets);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                  {isEditMode
                    ? "Drag widgets to reorganize, click remove to delete"
                    : "Track your finances at a glance"}
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
              <div className="flex flex-wrap gap-2">
                {!isEditMode && (
                  <NewTransaction
                    trigger={
                      <Button
                        className="gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow"
                        aria-label="Add transaction"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Transaction</span>
                      </Button>
                    }
                  />
                )}
                {isEditMode && (
                  <AddWidgetDialog
                    existingWidgets={widgets}
                    onAddWidget={handleAddWidget}
                  />
                )}
                <Button
                  onClick={() => isEditMode ? handleSaveEdit() : setIsEditMode(true)}
                  variant={isEditMode ? "default" : "outline"}
                  className="gap-2 font-semibold"
                >
                  {isEditMode ? (
                    <>
                      <Check className="h-4 w-4" />
                      Done
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Widgets Grid */}
          {widgets.length === 0 ? (
            <div className="flex items-center justify-center min-h-96 bg-secondary/30 rounded-lg border-2 border-dashed border-border">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground font-medium">No widgets available</p>
                <p className="text-sm text-muted-foreground">Click Edit to add widgets to your dashboard</p>
              </div>
            </div>
          ) : (
            <DashboardGrid
              widgets={widgets}
              onLayoutChange={handleLayoutChange}
              dateFilter={{ startDate: startDateStr, endDate: endDateStr }}
              isEditMode={isEditMode}
              onRemoveWidget={handleRemoveWidget}
            />
          )}
        </div>
      </main>
    </>
  );
}
