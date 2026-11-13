import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
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
  bank: {
    connections: ["bank", "connections"] as const,
    institutions: ["bank", "institutions"] as const,
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
  /** "I" entrata, "E" spesa, "T" trasferimento (migrazione 011 del server) */
  type: "I" | "E" | "T";
  /** Wallet della transazione; per una "T" e' l'origine. Null solo per una "T" da assegnare. */
  wallet_id: number | null;
  /** Solo per una "T": la destinazione. Null = lato da assegnare. */
  to_wallet_id?: number | null;
  /** Rimborso (migrazione 014 del server): una "I" con categoria di spesa, che riduce quella spesa. */
  is_refund?: boolean;
  category_id: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ogni scrittura su una `Transaction` muove quattro liste: le transazioni, i saldi dei
 * wallet (derivati dalle transazioni) e le due viste filtrate `/income` e `/expense`.
 * Erano le stesse quattro righe ripetute in ogni mutation, ed è così che una quinta
 * lista finirebbe per restare stantia in una sola di esse.
 */
function invalidateTransactionData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
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
  /** "account" = conto; "pot" = salvadanaio di un conto (migrazione 012 del server). Assente prima della 012. */
  kind?: "account" | "pot";
  /** Solo per un salvadanaio: il conto a cui appartiene. */
  parent_wallet_id?: number | null;
  /** Tetto fisso in centesimi (migrazione 013). */
  cap_cents?: number | null;
  /** Tetto calcolato dal piano annuale (somma delle rate dei prossimi 12 mesi). */
  cap_from_plan?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Input di `POST /wallet`: il saldo e' derivato, quindi non e' accettato. */
export type WalletCreateInput = {
  name: string;
  /** Per un salvadanaio: `kind: "pot"` e il conto padre. Un conto non manda nessuno dei due. */
  kind?: "pot";
  parent_wallet_id?: number;
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
  cap_cents?: number | null;
  cap_from_plan?: boolean;
};

export interface Category extends Record<string, unknown> {
  id: string;
  userid: string;
  name: string;
  /**
   * Il database usa "I" / "E" / "T". La sola categoria "T" e' quella di sistema
   * "Transfer": si rinomina e basta (server, `routes/category.js`).
   */
  type: "I" | "E" | "T";
  active: boolean;
  /** Colore e icona scelti (migrazione 017), null = automatici: `lib/categoryStyle.tsx`. */
  color?: string | null;
  icon?: string | null;
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
      invalidateTransactionData(queryClient);
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
      invalidateTransactionData(queryClient);
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
      invalidateTransactionData(queryClient);
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

      invalidateTransactionData(queryClient);
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

// Bank Hooks
export interface BankConnectionSummary {
  bank: string;
  account: string | null;
  lastSynced: string | null;
  autoImport: { enabled: boolean; walletId: number | null; fromDate: string | null } | null;
  /** Ultimo saldo letto dalla banca (migrazione 008 del server), o null. */
  balance?: { amount: number; currency: string; type?: string | null; fetchedAt: string | null } | null;
}

/** Banche collegate dall'utente (GET /bank/connections), con l'import automatico. */
export function useBankConnections() {
  return useQuery({
    queryKey: queryKeys.bank.connections,
    queryFn: async () => {
      const res = await apiFetch("/bank/connections");
      if (!res.ok) throw new Error("Failed to fetch bank connections");
      const data = (await res.json()) as { connections?: BankConnectionSummary[] };
      return data.connections ?? [];
    },
  });
}

/** Istituti disponibili (GET /bank/institutions): servono solo per mostrare il nome della banca. */
export function useBankInstitutions() {
  return useQuery({
    queryKey: queryKeys.bank.institutions,
    queryFn: async () => {
      const res = await apiFetch("/bank/institutions");
      if (!res.ok) throw new Error("Failed to fetch bank institutions");
      // `logo` arriva da GoCardless (assente nella lista di ripiego quando il provider non risponde).
      return (await res.json()) as Array<{ id: string; name: string; logo?: string | null }>;
    },
    staleTime: 60 * 60 * 1000,
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

// Movements
/**
 * Entrate, spese e trasferimenti del periodo in una sola lista (`GET /transaction/all` con
 * le date): la pagina Movements filtra e somma lato client (`lib/movements.ts`). La chiave
 * sta sotto `transactions`, quindi ogni scrittura su una transazione la invalida.
 */
export function useMovements(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byDateRange(startDate, endDate),
    queryFn: async () => {
      const query = buildQuery({ startDate, endDate });
      const res = await apiFetch(`/transaction/all${query}`);
      if (!res.ok) throw new Error("Failed to fetch movements");
      return parseListResponse<Transaction>(await res.json());
    },
  });
}

// Transfers
/**
 * Trasferimenti ("T") dell'utente, completi e da assegnare.
 *
 * Il server non filtra `/transaction/all` per tipo, quindi il filtro e' qui. La chiave
 * sta sotto `transactions`: ogni scrittura su una transazione la invalida
 * (`invalidateTransactionData`). `truncated` resta quello della lista intera: se il
 * server ha tagliato le transazioni, anche i trasferimenti possono essere incompleti.
 */
export function useTransfers() {
  return useQuery({
    queryKey: [...queryKeys.transactions.all, "transfers"] as const,
    queryFn: async () => {
      const res = await apiFetch("/transaction/all");
      if (!res.ok) throw new Error("Failed to fetch transfers");
      const list = parseListResponse<Transaction>(await res.json());
      const rows = list.rows.filter((transaction) => transaction.type === "T");
      return { ...list, rows };
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
