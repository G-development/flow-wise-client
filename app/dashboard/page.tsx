"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import {
  Pencil,
  Trash,
  Circle,
  MoveUp,
  MoveDown,
  MousePointerClick,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NewTransactionDrawer from "@/components/new-transaction-drawer";
import DatePickerWithRange from "@/components/date-picker";
import Navbar from "@/components/navbar";
import { Line_Chart } from "@/components/line-chart";
import { Pie_Chart } from "@/components/pie-chart";
import LoadingSpinner from "@/components/loading-spinner";

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
  charts?: {
    income_expense: { date: string; income: number; expense: number }[];
    expense_category: { category: string; value: number; fill: string }[];
    running_balance: { date: string; sum: number }[];
  };
};

export default function Dashboard() {
  useAuth();

  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);

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
  const { data, loading, fetchData } = useFetch<DashboardData>(
    `dashboard?startDate=${dateRange?.from}&endDate=${dateRange?.to}`
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

  const balanceChartConfig = {
    sum: {
      label: "Balance",
      color: "#6495ED",
    },
  };

  const chartConfig = {
    income: {
      label: "Income",
      color: "#22c55e",
    },
    expense: {
      label: "Expense",
      color: "#dc2626",
    },
  };

  const pieConfig = {
    visitors: {
      label: "Visitors",
    },
    chrome: {
      label: "Chrome",
      color: "hsl(var(--chart-1))",
    },
    safari: {
      label: "Safari",
      color: "hsl(var(--chart-2))",
    },
    firefox: {
      label: "Firefox",
      color: "hsl(var(--chart-3))",
    },
    edge: {
      label: "Edge",
      color: "hsl(var(--chart-4))",
    },
    other: {
      label: "Other",
      color: "hsl(var(--chart-5))",
    },
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-3 md:space-y-6 p-4 md:p-8 pt-3 md:pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-col items-center md:flex-row gap-6">
            {/* NEW TRANSACTION BTN */}
            <NewTransactionDrawer fetchData={fetchData} />
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
          </div>
        </div>

        {/* 4 CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Dialog open={openIncome} onOpenChange={setOpenIncome}>
            <Card
              onClick={() => setOpenIncome(true)}
              className="cursor-pointer group"
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Incomes{" "}
                  <MousePointerClick className="cursor-pointer transition-colors duration-200 group-hover:text-blue-500" />
                </CardTitle>
                <CardDescription className="hidden sm:block">
                  Total incomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <p className="text-2xl font-bold text-green-500">
                    {data?.totals
                      ? "+" + data.totals.income + "€"
                      : "No sum available"}
                  </p>
                )}
              </CardContent>
              <CardFooter className="text-sm">
                <p>Δ PM: +1%</p>
              </CardFooter>
            </Card>

            <DialogContent className="max-w-[90%] rounded-md md:max-w-2xl max-h-[70%] md:max-h-[90%] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Incomes detail</DialogTitle>
                <DialogDescription>
                  Tabulate of incomes of the selected period
                </DialogDescription>
              </DialogHeader>
              <Table className="caption-top">
                <TableCaption></TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] capitalize">
                      Income
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.income?.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium capitalize">
                        Income
                      </TableCell>
                      <TableCell className="truncate max-w-[10ch] md:max-w-none capitalize">
                        {item.category.name}
                      </TableCell>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-green-500">
                        €{item.amount}
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
                          transactionType="income"
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
                          transactionType="income"
                          id={item._id}
                          fetchData={fetchData}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Dialog open={openExpense} onOpenChange={setOpenExpense}>
            <Card
              onClick={() => setOpenExpense(true)}
              className="cursor-pointer group"
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Expenses{" "}
                  <MousePointerClick className="cursor-pointer transition-colors duration-200 group-hover:text-blue-500" />
                </CardTitle>
                <CardDescription className="hidden sm:block">
                  Total expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <p className="text-2xl font-bold text-red-600">
                    {data?.totals
                      ? "-" + data.totals.expense + "€"
                      : "No sum available"}
                  </p>
                )}
              </CardContent>
              <CardFooter className="text-sm">
                <p>Δ PM: +1.2%</p>
              </CardFooter>
            </Card>

            <DialogContent className="max-w-[90%] rounded-md md:max-w-2xl max-h-[70%] md:max-h-[90%] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Expenses detail</DialogTitle>
                <DialogDescription>
                  Tabulate of expenses of the selected period
                </DialogDescription>
              </DialogHeader>
              <Table className="caption-top">
                <TableCaption></TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] capitalize">
                      Expense
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.expense?.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium capitalize">
                        Expense
                      </TableCell>
                      <TableCell className="truncate max-w-[10ch] md:max-w-none capitalize">
                        {item.category.name}
                      </TableCell>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -€{item.amount}
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
                          transactionType="expense"
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
                          transactionType="expense"
                          id={item._id}
                          fetchData={fetchData}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>Net balance</CardTitle>
              <CardDescription className="hidden sm:block">
                Incomes - Expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <p className="text-2xl font-bold flex items-center">
                  {data?.net}€
                  {data?.net && data.net > 0 ? (
                    <MoveUp className="text-green-500" />
                  ) : (
                    <MoveDown className="text-red-500" />
                  )}
                </p>
              )}
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
              {loading ? (
                <LoadingSpinner />
              ) : (
                <p className="text-2xl font-bold">{data?.savingsRate}</p>
              )}
            </CardContent>
            <CardFooter className="text-sm">
              <p>Monthly savings goal: X%</p>
            </CardFooter>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="rounded-lg">
              <Line_Chart
                data={data?.charts?.running_balance ?? []}
                XAxisKey="date"
                chartConfig={balanceChartConfig}
                title="Running balance"
                description={
                  dateRange?.from?.toLocaleDateString("it-IT") +
                  " to " +
                  dateRange?.to?.toLocaleDateString("it-IT")
                }
                footerText="Overview of the selected period"
              />
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="rounded-lg">
              <Pie_Chart
                data={data?.charts?.expense_category ?? []}
                chartConfig={pieConfig}
                title="Expenses by category"
                description={
                  dateRange?.from?.toLocaleDateString("it-IT") +
                  " to " +
                  dateRange?.to?.toLocaleDateString("it-IT")
                }
                footerText="Overview of the selected period"
              />
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="rounded-lg">
              <Line_Chart
                data={data?.charts?.income_expense ?? []}
                XAxisKey="date"
                chartConfig={chartConfig}
                title="Income & expense"
                description={
                  dateRange?.from?.toLocaleDateString("it-IT") +
                  " to " +
                  dateRange?.to?.toLocaleDateString("it-IT")
                }
                footerText="Overview of the selected period"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
