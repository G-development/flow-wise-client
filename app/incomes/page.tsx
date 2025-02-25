"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/useAuth";
import DatePickerWithRange from "@/components/date-picker";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import SimpleTable from "@/components/table";
import Navbar from "@/components/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null); // Resetta l'errore

    const token = localStorage.getItem("fw-token")
    try {
      const queryParams = new URLSearchParams();
      if (dateRange?.from)
        queryParams.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to)
        queryParams.append("endDate", dateRange.to.toISOString());

      const response = await fetch(
        `${API_URL}/income/all?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Token is not valid");

      const res = await response.json();
      setIncomes(res);
    } catch (error) {
      console.error(error);
      setError("An error occurred while fetching data.");
      localStorage.removeItem("fw-token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  // if (loading)
  //   return <div>Loading...</div>;
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-lg font-semibold">
        <span>Error occurred: {error}</span>
        <span className="ml-2 text-2xl cursor-pointer">✖</span>
      </div>
    ); // Stato errore

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
            data={incomes}
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
