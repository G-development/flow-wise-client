"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash, Circle } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import DatePickerWithRange from "@/components/date-picker";
import Navbar from "@/components/navbar";

import DeleteDialog from "./delete-dialog";
import EditDialog from "./edit-dialog";
import { getStatusColor } from "./calculateStatus";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [transactionToEdit, setTransactionToEdit] = useState<string | null>(
    null
  );
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );
  const router = useRouter();

  const fetchData = useCallback(() => {
    const token = localStorage.getItem("fw-token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDataAsync = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Token non valido");

        const res = await response.json();
        setData(res);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("fw-token");
        router.push("/login");
      }
    };

    fetchDataAsync();
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    [key: string]: Transaction[] | undefined;
  };

  return (
    <div>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <DatePickerWithRange />
        </div>
        <NewTransactionDrawer fetchData={fetchData} />
        {Object.entries(data).map(([key, transactions]) => (
          <Table key={key} className="caption-top">
            <TableCaption>
              A list of your recent {key} transactions.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] capitalize">{key}</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions as Transaction[]).map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium capitalize">
                    {key}
                  </TableCell>
                  <TableCell className="truncate max-w-[10ch] md:max-w-none">
                    {item.category.charAt(0).toUpperCase() +
                      item.category.slice(1)}
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
                  <TableCell className="text-center">
                    <Circle
                      className={`${getStatusColor(item.amount)} h-4 w-4 inline`}
                    />
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTransactionToEdit(item._id)} // Imposta l'ID della transazione da eliminare
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <EditDialog
                      isOpen={transactionToEdit === item._id} // Mostra solo per la transazione selezionata
                      onClose={() => setTransactionToEdit(null)} // Chiudi il dialogo
                      transactionType={key}
                      id={item._id}
                      fetchData={fetchData}
                    />

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setTransactionToDelete(item._id)} // Imposta l'ID della transazione da eliminare
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <DeleteDialog
                      isOpen={transactionToDelete === item._id}
                      onClose={() => setTransactionToDelete(null)} // Chiudi il dialogo
                      transactionType={key}
                      id={item._id}
                      fetchData={fetchData}
                    />
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
