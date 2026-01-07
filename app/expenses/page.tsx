"use client";

import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { apiFetch, buildQuery, getAuthToken } from "@/lib/api";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";

export default function Expenses() {
  type Transaction = {
    id: number;
    userid: string;
    description: string;
    note: string | null;
    amount: number;
    date: string;
    type: string;
    wallet_id: number;
    category_id: number;
    created_at: string | null;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);


  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const query = buildQuery({
        startDate: dateRange?.from?.toISOString().split("T")[0],
        endDate: dateRange?.to?.toISOString().split("T")[0],
      });

      const res = await apiFetch(`/expense/all${query}`, {}, token);
      if (!res.ok) {
        setTransactions([]);
        return;
      }
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setTransactions([]);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <div className="flex gap-2">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            <NewTransaction onSuccess={fetchTransactions} />
          </div>
        </div>

        <DynamicTable
          data={transactions}
          caption={`Expense transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}`}
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
              onSuccess={fetchTransactions}
            />
            <DeleteDialog
              id={selectedId}
              isOpen={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onSuccess={fetchTransactions}
            />
          </>
        )}
      </div>
    </>
  );
}
