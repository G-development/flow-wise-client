"use client";

import Navbar from "@/components/navbar";

export default function Budgets() {
  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set and monitor your budget by category
            </p>
          </div>
        </div>

        {/* Work in Progress */}
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-muted-foreground text-lg">Work in progress</p>
        </div>
      </div>
    </>
  );
}
