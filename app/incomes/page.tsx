"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import DatePickerWithRange from "@/components/date-picker";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import SimpleTable from "@/components/table";
import Navbar from "@/components/navbar";

interface Category {
  name: string;
}

interface Income {
  _id: string;
  category?: Category;
  [key: string]: unknown;
}

export default function Incomes() {
  useAuth();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const queryParams = new URLSearchParams();
  if (dateRange?.from)
    queryParams.append("startDate", dateRange.from.toISOString());
  if (dateRange?.to) queryParams.append("endDate", dateRange.to.toISOString());

  const {
    data: incomes,
    loading,
    error,
    fetchData,
  } = useFetch<Income[]>(`income/all?${queryParams.toString()}`);

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  if (error) {
    localStorage.removeItem("fw-token");
    router.push("/login");
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg font-semibold">
        <span>Error occurred: {error}</span>
        <span className="ml-2 text-2xl cursor-pointer">✖</span>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Incomes</h1>
          <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
        </div>
        <NewTransactionDrawer fetchData={fetchData} disableExpense={true} />
        {!loading ? (
          <SimpleTable
            data={incomes ?? []}
            caption="List of recent incomes"
            fetchData={fetchData}
            transactionType="income"
          />
        ) : (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black-800"></div>
          </div>
        )}
      </div>
    </>
  );
}
