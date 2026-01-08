"use client";

import Navbar from "@/components/navbar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { useDashboardLayout, useSaveDashboardLayout } from "@/lib/hooks/useQueries";
import { DEFAULT_LAYOUT, Widget } from "@/lib/types/dashboard";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/loading-spinner";

export default function Dashboard() {
  const { data: layoutData, isLoading } = useDashboardLayout();
  const saveLayout = useSaveDashboardLayout();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [initialized, setInitialized] = useState(false);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Trascina i widget per riorganizzare
          </p>
        </div>

        {/* Nota mobile: editing layout solo da desktop */}
        <p className="text-xs text-muted-foreground mb-4 md:hidden">
          Modifiche al layout disponibili solo da desktop.
        </p>
        
        {widgets.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Nessun widget disponibile
          </div>
        ) : (
          <DashboardGrid widgets={widgets} onLayoutChange={handleLayoutChange} />
        )}
      </div>
    </>
  );
}
