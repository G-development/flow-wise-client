"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import DatePickerWithRange from "@/components/date-picker";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import SimpleTable from "@/components/table";
import Navbar from "@/components/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Category {
  name: string;
}

interface Expense {
  _id: string;
  category?: Category;
  [key: string]: unknown;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Stato di caricamento
  const [error, setError] = useState<string | null>(null); // Stato errore
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("fw-token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null); // Resetta l'errore

    try {
      const response = await fetch(`${API_URL}/expense/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Token is not valid");

      const res = await response.json();
      setExpenses(res);
    } catch (error) {
      console.error(error);
      setError("An error occurred while fetching data."); // Mostra errore utente
      localStorage.removeItem("fw-token");
      router.push("/login");
    } finally {
      setLoading(false); // Termina il caricamento
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading...</div>; // Stato di caricamento
  if (error) return <div>{error}</div>; // Stato errore

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <DatePickerWithRange />
        </div>
        <NewTransactionDrawer fetchData={fetchData} disableIncome={true} />
        <SimpleTable data={expenses} caption="List of recent expenses" />
      </div>
    </>
  );
}
