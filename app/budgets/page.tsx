"use client";

import Navbar from "@/components/navbar";

export default function Budgets() {
  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-lg">Work in progress</p>
        </div>
      </div>
    </>
  );
}
