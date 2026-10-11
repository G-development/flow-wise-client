"use client";

import { MovementsList } from "@/components/movements-list";
import Navbar from "@/components/navbar";
import { useExpenses } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { useDateRange } from "@/lib/providers/DateRangeProvider";

export default function Expenses() {
  const { dateRange } = useDateRange();

  const { data: movements = EMPTY_LIST_RESPONSE, isLoading, refetch } = useExpenses(
    dateRange?.from?.toISOString().split("T")[0],
    dateRange?.to?.toISOString().split("T")[0]
  );

  return (
    <>
      <Navbar />
      <MovementsList
        title="Expenses"
        description="Record and analyze your expenses"
        captionPrefix="Expense"
        transactions={movements.rows}
        truncated={movements.truncated}
        total={movements.total}
        isLoading={isLoading}
        onRefetch={() => refetch()}
      />
    </>
  );
}
