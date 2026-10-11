"use client";

import { MovementsList } from "@/components/movements-list";
import Navbar from "@/components/navbar";
import { useIncomes } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { useDateRange } from "@/lib/providers/DateRangeProvider";

export default function Incomes() {
  const { dateRange } = useDateRange();

  const { data: movements = EMPTY_LIST_RESPONSE, isLoading, refetch } = useIncomes(
    dateRange?.from?.toISOString().split("T")[0],
    dateRange?.to?.toISOString().split("T")[0]
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <MovementsList
        title="Incomes"
        description="Record and track your earnings"
        captionPrefix="Income"
        transactions={movements.rows}
        truncated={movements.truncated}
        total={movements.total}
        isLoading={isLoading}
        onRefetch={() => refetch()}
      />
    </div>
  );
}
