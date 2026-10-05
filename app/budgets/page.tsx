"use client";

import Navbar from "@/components/navbar";

export default function Budgets() {
  return (
    <>
      <Navbar />
      <main className="app-page">
        {/* Header */}
        <div className="app-page-header">
          <div>
            <h1 className="page-title">Budgets</h1>
            <p className="page-description">
              Set and monitor your budget by category
            </p>
          </div>
        </div>

        {/* Work in Progress */}
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-muted-foreground text-lg">Work in progress</p>
        </div>
      </main>
    </>
  );
}
