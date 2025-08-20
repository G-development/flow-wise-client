"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { supabase } from "@/lib/supabaseClient";

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const queryParams = new URLSearchParams();
  if (dateRange?.from)
    queryParams.append("startDate", dateRange.from.toISOString().split("T")[0]);
  if (dateRange?.to)
    queryParams.append("endDate", dateRange.to.toISOString().split("T")[0]);

  useEffect(() => {
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
        const res = await fetch(
          `${API_URL}/expense/all?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          console.error("API did not return an array:", data);
          setTransactions([]);
        }
      } catch (err) {
        console.error(err);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [dateRange]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <div className="flex gap-2">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            <NewTransaction />
          </div>
        </div>

        <DynamicTable
          data={transactions}
          caption={`Expense transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()} `}
          actions={true}
        />
      </div>
    </>
  );
}
