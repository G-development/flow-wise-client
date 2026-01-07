"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useIncomes } from "@/lib/hooks/useQueries";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";

export default function Incomes() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: transactions = [], isLoading, refetch } = useIncomes(
    dateRange?.from?.toISOString().split("T")[0],
    dateRange?.to?.toISOString().split("T")[0]
  );

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Incomes</h1>
          <div className="flex gap-2">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            <NewTransaction onSuccess={() => refetch()} />
          </div>
        </div>

        <DynamicTable
          data={transactions}
          caption={`Income transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}`}
          isLoading={isLoading}
          renderActions={(row) => (
            <div className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedId(row.id as number);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedId(row.id as number);
                  setDeleteOpen(true);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        />

        {selectedId !== null && (
          <>
            <EditDialog
              id={selectedId}
              isOpen={editOpen}
              onClose={() => setEditOpen(false)}
              onSuccess={() => refetch()}
            />
            <DeleteDialog
              id={selectedId}
              isOpen={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onSuccess={() => refetch()}
            />
          </>
        )}
      </div>
    </>
  );
}
