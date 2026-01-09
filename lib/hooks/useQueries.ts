import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQuery } from "@/lib/api";
import { toast } from "sonner";
import { DashboardLayout, Widget } from "@/lib/types/dashboard";

// Query Keys
export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    byDateRange: (start?: string, end?: string) => 
      ["transactions", { start, end }] as const,
  },
  wallets: {
    all: ["wallets"] as const,
  },
  categories: {
    all: ["categories"] as const,
    active: ["categories", "active"] as const,
  },
  incomes: {
    all: ["incomes"] as const,
    byDateRange: (start?: string, end?: string) => 
      ["incomes", { start, end }] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    byDateRange: (start?: string, end?: string) => 
      ["expenses", { start, end }] as const,
  },
  dashboardLayout: {
    current: ["dashboard-layout"] as const,
  },
};

// Types
export interface Transaction extends Record<string, unknown> {
  id: string;
  userid: string;
  amount: number;
  description: string;
  note?: string | null;
  date: string;
  type: "I" | "E";
  wallet_id: number;
  category_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface Wallet extends Record<string, unknown> {
  id: string;
  userid: string;
  name: string;
  balance: number;
  currency: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category extends Record<string, unknown> {
  id: string;
  userid: string;
  name: string;
  type: "income" | "expense";
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Transactions Hooks
export function useTransactions(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byDateRange(startDate, endDate),
    queryFn: async () => {
      const query = buildQuery({ startDate, endDate });
      const res = await apiFetch(`/transaction${query}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json() as Promise<Transaction[]>;
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/transaction/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Transaction deleted");
    },
    onError: () => {
      toast.error("Failed to delete transaction");
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Transaction>) => {
      const res = await apiFetch("/transaction", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Transaction created");
    },
    onError: () => {
      toast.error("Failed to create transaction");
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const res = await apiFetch(`/transaction/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Transaction updated");
    },
    onError: () => {
      toast.error("Failed to update transaction");
    },
  });
}

// Wallets Hooks
export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: async () => {
      const res = await apiFetch("/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallets");
      return res.json() as Promise<Wallet[]>;
    },
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Wallet>) => {
      const res = await apiFetch("/wallet", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create wallet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      toast.success("Wallet created");
    },
    onError: () => {
      toast.error("Failed to create wallet");
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Wallet> }) => {
      const res = await apiFetch(`/wallet/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update wallet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      toast.success("Wallet updated");
    },
    onError: () => {
      toast.error("Failed to update wallet");
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/wallet/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete wallet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      toast.success("Wallet deleted");
    },
    onError: () => {
      toast.error("Failed to delete wallet");
    },
  });
}

// Categories Hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const res = await apiFetch("/category");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json() as Promise<Category[]>;
    },
  });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: queryKeys.categories.active,
    queryFn: async () => {
      const res = await apiFetch("/category/active");
      if (!res.ok) throw new Error("Failed to fetch active categories");
      return res.json() as Promise<Category[]>;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const res = await apiFetch("/category", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category created");
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const res = await apiFetch(`/category/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category updated");
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/category/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });
}

// Income/Expense Hooks
export function useIncomes(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.incomes.byDateRange(startDate, endDate),
    queryFn: async () => {
      const query = buildQuery({ startDate, endDate });
      const res = await apiFetch(`/income/all${query}`);
      if (!res.ok) throw new Error("Failed to fetch incomes");
      return res.json() as Promise<Transaction[]>;
    },
  });
}

export function useExpenses(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.byDateRange(startDate, endDate),
    queryFn: async () => {
      const query = buildQuery({ startDate, endDate });
      const res = await apiFetch(`/expense/all${query}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json() as Promise<Transaction[]>;
    },
  });
}

// ============= Dashboard Layout Hooks =============

export function useDashboardLayout() {
  return useQuery({
    queryKey: queryKeys.dashboardLayout.current,
    queryFn: async () => {
      const res = await apiFetch("/dashboard-layout");
      if (!res.ok) throw new Error("Failed to fetch dashboard layout");
      return res.json() as Promise<DashboardLayout>;
    },
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (widgets: Widget[]) => {
      const res = await apiFetch("/dashboard-layout", {
        method: "PUT",
        body: JSON.stringify({ widgets }),
      });
      if (!res.ok) throw new Error("Failed to save dashboard layout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardLayout.current });
      toast.success("Layout saved");
    },
    onError: () => {
      toast.error("Error saving layout");
    },
  });
}
