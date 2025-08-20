"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { supabase } from "@/lib/supabaseClient";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";

export default function Incomes() {
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const fetchTransactions = async () => {
    const session = supabase.auth.getSession
      ? await supabase.auth.getSession()
      : null;
    const token = session?.data?.session?.access_token;

    if (!token) {
      console.error("No Supabase session found");
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (dateRange?.from)
        queryParams.append(
          "startDate",
          dateRange.from.toISOString().split("T")[0]
        );
      if (dateRange?.to)
        queryParams.append("endDate", dateRange.to.toISOString().split("T")[0]);

      const res = await fetch(
        `${API_URL}/income/all?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (Array.isArray(data)) setTransactions(data);
      else {
        console.error("API did not return an array:", data);
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Incomes</h1>
          <div className="flex gap-2">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            <NewTransaction onSuccess={fetchTransactions} />
          </div>
        </div>

        <DynamicTable
          data={transactions}
          caption={`Income transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}`}
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
