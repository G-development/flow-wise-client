import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, buildQuery } from "@/lib/api";
import { parseListResponse } from "@/lib/listResponse";
import { errorFromResponse } from "@/lib/httpError";
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

/**
 * Risorsa wallet come la restituisce `GET /wallet`.
 *
 * `balance` NON e' una colonna memorizzata: e' il saldo DERIVATO dalle transazioni
 * (vedi `utils/walletService.js` nel server, che lo sovrascrive nella risposta).
 * Il campo si chiama `balance` anche nell'API, quindi il nome resta; cio' che non
 * deve esistere e' un tipo di scrittura che lo accetti come valore da persistere:
 * per quello usa `WalletCreateInput` / `WalletUpdateInput`.
 */
export interface Wallet extends Record<string, unknown> {
  id: string;
  userid: string;
  name: string;
  /** saldo derivato dalle transazioni, non memorizzato sulla riga `Wallet` */
  balance: number;
  /**
   * Saldo di APERTURA in centesimi (intero, segno ammesso): e' il punto di
   * partenza della somma derivata in `utils/walletService.js`, non il saldo
   * finale. In UI si digita in EUR e si converte con `Math.round(euro * 100)`.
   */
  opening_balance_cents: number;
  currency: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Input di `POST /wallet`: il saldo e' derivato, quindi non e' accettato. */
export type WalletCreateInput = {
  name: string;
};

/**
 * Input di `PUT /wallet/:id`: il saldo FINALE e' derivato e non e' aggiornabile,
 * il saldo di APERTURA si' (in centesimi interi, segno ammesso): e' il punto di
 * partenza da cui il server ricostruisce `balance`.
 */
export type WalletUpdateInput = {
  name?: string;
  is_default?: boolean;
  opening_balance_cents?: number;
};

export interface Category extends Record<string, unknown> {
  id: string;
  userid: string;
  name: string;
  /** Il database usa "I" / "E"; questo tipo seguiva "income" | "expense" e non corrispondeva. */
  type: "I" | "E";
  active: boolean;
  created_at?: string;
  updated_at?: string;
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
      // Il 400 di validazione (es. amount negativo) va mostrato al cliente: il
      // messaggio sta in `details[].message`, non nel generico "Validation error".
      if (!res.ok) {
        throw await errorFromResponse(res, "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Transaction created");
    },
    onError: (error) => {
      toast.error(error.message);
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
      if (!res.ok) {
        throw await errorFromResponse(res, "Failed to update transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Transaction updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Import CSV (`POST /import/csv`).
 *
 * Restituisce la `Response` grezza e non mostra toast: la pagina
 * `/settings/import` gestisce già i propri messaggi con un `id` condiviso e lo
 * stato `importResult`. L'invalidazione avviene solo sul ramo di successo.
 */
export function useImportCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { csv: string }) => {
      return apiFetch("/import/csv", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (res) => {
      if (!res.ok) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
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
    mutationFn: async (data: WalletCreateInput) => {
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
    mutationFn: async ({ id, data }: { id: string; data: WalletUpdateInput }) => {
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
/**
 * Categorie dell'utente.
 *
 * Come `useIncomes`/`useExpenses` il risultato e' l'envelope
 * `{ rows, count, truncated, total }` (vedi `lib/listResponse.ts`), non un array:
 * il server pagina oltre il tetto PostgREST e dichiara quando il set e' parziale.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const res = await apiFetch("/category");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return parseListResponse<Category>(await res.json());
    },
  });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: queryKeys.categories.active,
    queryFn: async () => {
      const res = await apiFetch("/category/active");
      if (!res.ok) throw new Error("Failed to fetch active categories");
      return parseListResponse<Category>(await res.json());
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
      if (!res.ok) throw await errorFromResponse(res, "Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category created");
    },
    onError: (error) => {
      toast.error(error.message);
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
      if (!res.ok) throw await errorFromResponse(res, "Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/category/${id}`, { method: "DELETE" });
      if (!res.ok) throw await errorFromResponse(res, "Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Income/Expense Hooks
/**
 * Liste di entrate/spese dell'intervallo richiesto.
 *
 * Il risultato non e' un array ma l'envelope `{ rows, count, truncated, total }`
 * (vedi `lib/listResponse.ts`): le somme vanno calcolate su `rows`, e quando
 * `truncated` e' `true` la lista e' un sottoinsieme e il totale non e' definitivo.
 */
export function useIncomes(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.incomes.byDateRange(startDate, endDate),
    queryFn: async () => {
      const query = buildQuery({ startDate, endDate });
      const res = await apiFetch(`/income/all${query}`);
      if (!res.ok) throw new Error("Failed to fetch incomes");
      return parseListResponse<Transaction>(await res.json());
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
      return parseListResponse<Transaction>(await res.json());
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
