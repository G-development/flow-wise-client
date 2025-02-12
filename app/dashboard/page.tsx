"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import DatePickerWithRange from "@/components/date-picker";

// import { Nav } from "@/components/nav-menu";
import Navbar from "@/components/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({});
  const router = useRouter();

  async function fetchData() {
    const token = localStorage.getItem("fw-token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Token non valido");
      }

      const res = await response.json();
      console.log(res);
      setData(res);
    } catch (error) {
      console.error(error);
      localStorage.removeItem("fw-token");
      router.push("/login");
    }
  }

  useEffect(() => {
    fetchData();
  }, [router]);

  interface Transaction {
    _id: string;
    user: string;
    amount: number;
    category: string;
    date: string;
    createdAt: string;
    updatedAt: string;
  }

  type DashboardData = {
    income?: Transaction[];
    expense?: Transaction[];
    [key: string]: Transaction[] | undefined; // Permette altre possibili categorie
  };

  // return <Nav />;
  return (
    <div>
      <Navbar />
      <div className=" flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <DatePickerWithRange />
        </div>
        <NewTransactionDrawer fetchData={fetchData} />
        {Object.entries(data).map(([key, transactions]) => (
          <Table key={key}>
            <TableCaption>
              A list of your recent {key} transactions.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] capitalize">{key}</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions as Transaction[]).map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium capitalize">
                    {key}
                  </TableCell>
                  <TableCell className="truncate max-w-[10ch] md:max-w-none">
                    {item.category}
                  </TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      key === "income" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {key === "income" ? "€" : "-€"}
                    {item.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
      </div>
    </div>
  );
}
