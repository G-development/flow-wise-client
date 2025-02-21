"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { Pencil, Trash, Circle, MoveUp, MoveDown } from "lucide-react";
import { DateRange } from "react-day-picker";

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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import DatePickerWithRange from "@/components/date-picker";
import Navbar from "@/components/navbar";

import DeleteDialog from "./delete-dialog";
import EditDialog from "./edit-dialog";
import { getStatusColor } from "./calculateStatus";

interface Transaction {
  _id: string;
  user: string;
  amount: number;
  category: { _id: string; name: string };
  date: string;
  createdAt: string;
  updatedAt: string;
}

type Totals = {
  income: number;
  expense: number;
};

type DashboardData = {
  income?: Transaction[];
  expense?: Transaction[];
  totals?: Totals;
  net?: number;
  savingsRate?: string;
};

export default function Dashboard() {
  useAuth();

  const [transactionToEdit, setTransactionToEdit] = useState<string | null>(
    null
  );
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const { data, fetchData } = useFetch<DashboardData>(
    `dashboard?startDate=${dateRange?.from}&endDate=${dateRange?.to}`
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Incomes</CardTitle>
              <CardDescription className="hidden sm:block">
                Total incomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">
                {data?.totals
                  ? "+" + data.totals.income + "€"
                  : "No sum available"}
              </p>
            </CardContent>
            <CardFooter className="text-sm">
              <p>Δ PM: +1%</p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription className="hidden sm:block">
                Total expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {data?.totals
                  ? "-" + data.totals.expense + "€"
                  : "No sum available"}
              </p>
            </CardContent>
            <CardFooter className="text-sm">
              <p>Δ PM: +1.2%</p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net balance</CardTitle>
              <CardDescription className="hidden sm:block">
                Incomes - Expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center">
                {data?.net}€
                {data?.net && data.net > 0 ? (
                  <MoveUp className="text-green-500" />
                ) : (
                  <MoveDown className="text-red-500" />
                )}
              </p>
            </CardContent>
            <CardFooter className="text-sm">
              <p>Trend compared to last month</p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings rate</CardTitle>
              <CardDescription className="hidden sm:block">
                % income not spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.savingsRate}</p>
            </CardContent>
            <CardFooter className="text-sm">
              <p>Monthly savings goal: X%</p>
            </CardFooter>
          </Card>
        </div>

        <NewTransactionDrawer fetchData={fetchData} />

        {data &&
          Object.entries(data).map(([key, transactions]) =>
            Array.isArray(transactions) && transactions.length > 0 ? (
              <Table key={key} className="caption-top">
                <TableCaption>
                  A list of your recent {key} transactions.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] capitalize">
                      {key}
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium capitalize">
                        {key}
                      </TableCell>
                      <TableCell className="truncate max-w-[10ch] md:max-w-none capitalize">
                        {item.category.name}
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
                          className={`${getStatusColor(
                            item.amount
                          )} h-4 w-4 inline`}
                        />
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTransactionToEdit(item._id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <EditDialog
                          isOpen={transactionToEdit === item._id}
                          onClose={() => setTransactionToEdit(null)}
                          transactionType={key}
                          id={item._id}
                          fetchData={fetchData}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setTransactionToDelete(item._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <DeleteDialog
                          isOpen={transactionToDelete === item._id}
                          onClose={() => setTransactionToDelete(null)}
                          transactionType={key}
                          id={item._id}
                          fetchData={fetchData}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null
          )}
      </div>
    </>
  );
}
