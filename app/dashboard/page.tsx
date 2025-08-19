"use client";

import { useEffect, useState } from "react";

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
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  currency: string;
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
  externalTransactions: Transaction[];
};

const loading = false;

export default function Dashboard() {
  // useAuth();

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

            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
          </div>
        </div>
      </div>
    </>
  );
}
