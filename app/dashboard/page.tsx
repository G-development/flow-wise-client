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
import { Edit2, Check } from "lucide-react";

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
      <div className="container mx-auto py-4 md:py-8 px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              {isEditMode ? "Edit mode: drag to reorganize, click remove to delete widgets" : "Click Edit to customize your dashboard layout."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            {isEditMode && <AddWidgetDialog existingWidgets={widgets} onAddWidget={handleAddWidget} />}
            <Button
              onClick={() => isEditMode ? handleSaveEdit() : setIsEditMode(true)}
              variant={isEditMode ? "default" : "outline"}
              className="hidden sm:flex w-full sm:w-auto"
            >
              {isEditMode ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Done
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>
        
        {widgets.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No widgets available
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
    </>
  );
}
