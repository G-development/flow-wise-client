> ⚠️ **Generato con IA** - Questo documento è stato generato utilizzando GitHub Copilot

# API Structure & TanStack Query (React Query) - Guida Completa

Questo documento spiega in dettaglio come l'applicazione gestisce centralizzatamente le API e come React Query (TanStack Query) crea un sistema di caching e sincronizzazione robusto.

---

## Indice

1. [Gestione Centralizzata delle API](#gestione-centralizzata-delle-api)
2. [TanStack Query: Concetti Fondamentali](#tanstack-query-concetti-fondamentali)
3. [Setup e Provider](#setup-e-provider)
4. [Custom Hooks per Risorse](#custom-hooks-per-risorse)
5. [Flusso Completo: Esempio Pratico](#flusso-completo-esempio-pratico)
6. [Cache Invalidation Strategy](#cache-invalidation-strategy)
7. [Error Handling e Retry](#error-handling-e-retry)

---

## Modello dati: Transaction (frontend/backend)

- Campi attesi (snake_case) usati da client e server:
  - `id: string`
  - `userid: string`
  - `amount: number`
  - `description: string`
  - `note?: string | null`
  - `date: string` (ISO)
  - `type: "I" | "E"` (Income/Expense)
  - `wallet_id: number`
  - `category_id: number`
  - `created_at?`, `updated_at?`
- Gli hook React Query (`useIncomes`, `useExpenses`, `useTransactions`) e i widget della dashboard assumono questa forma; evitare campi misti `walletid`/`category` per ridurre cast e collisioni.

## Gestione Centralizzata delle API

### 1. Costanti Centralizzate (`lib/constants.ts`)

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
```

**Spiegazione:**
- `API_URL` è una costante che contiene la base URL del backend.
- In **locale**: `http://localhost:5030`
- In **produzione**: `https://flow-wise-server.vercel.app`
- Viene letta da `process.env.NEXT_PUBLIC_API_URL` (prefisso `NEXT_PUBLIC_` rende disponibile al browser).
- Centralizzare la URL evita duplicati e facilita configurazione per ambienti diversi.

**Uso:**
```typescript
import { API_URL } from "@/lib/constants";

// Invece di fare fetch a URL hardcoded:
// fetch("http://localhost:5030/wallet")

// Fai:
const url = `${API_URL}/wallet`;  // Sempre corretto
```

---

### 2. Helper Funzioni per Fetch (`lib/api.ts`)

#### A. `getAuthToken()`

```typescript
export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

**Spiegazione:**
- Recupera il token JWT dalla sessione Supabase.
- `supabase.auth.getSession()` ritorna l'oggetto sessione se l'utente è loggato.
- `?.access_token` estrae il token (safe navigation operator).
- `?? null` ritorna `null` se il token non esiste (user non loggato).
- Questa funzione centralizza l'accesso al token, evitando di leggere direttamente da Supabase in vari punti.

**Flusso:**
```
User logga
  ↓
Supabase client salva sessionStorage/localStorage
  ↓
getAuthToken() legge da supabase.auth.getSession()
  ↓
Ritorna token a apiFetch()
  ↓
Token inviato via Authorization header
```

---

#### B. `apiFetch()` - Helper Principale

```typescript
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  // 1. Ottieni il token (passato o da sessione)
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("No Supabase session found");

  // 2. Prepara headers con Authorization
  const headers: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
  };

  // 3. Merge headers esistenti (sia object che Headers instance)
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // 4. Auto-set Content-Type JSON se body presente
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  // 5. Effettua fetch con URL completo
  return fetch(`${API_URL}${path}`, { ...options, headers });
}
```

**Spiegazione passo per passo:**

1. **Ottiene il token**
   - Usa il token passato come parametro, oppure lo legge dalla sessione.
   - Se nessuno dei due esiste, lancia errore (user non loggato).

2. **Crea headers con Authorization**
   - `Authorization: Bearer <token>` è lo standard per JWT.
   - Server validerà questo header con `requireAuth` middleware.

3. **Merge headers**
   - Se l'utente passa headers aggiuntivi (e.g., `content-type` personalizzato), vengono merged.
   - Gestisce sia `Headers` instance che plain object (TypeScript compatibility).

4. **Auto-set Content-Type**
   - Se c'è un body (POST/PUT) e non è FormData, aggiunge `application/json`.
   - Evita di doverlo specificare manualmente ogni volta.
   - FormData non ha Content-Type (browser lo aggiunge automaticamente).

5. **Effettua fetch**
   - Combina `API_URL` + `path`.
   - Ritorna la `Response` direttamente.

**Esempio uso:**
```typescript
// GET risorsa
const res = await apiFetch("/wallet");
const wallets = await res.json();

// POST con dati
const res = await apiFetch("/wallet", {
  method: "POST",
  body: JSON.stringify({ name: "Savings", balance: 1000 })
});

// PUT con dati
const res = await apiFetch(`/wallet/123`, {
  method: "PUT",
  body: JSON.stringify({ balance: 2000 })
});

// DELETE
const res = await apiFetch(`/wallet/123`, { method: "DELETE" });
```

---

#### C. `bankApiFetch()` - Helper per API Bancarie

```typescript
export async function bankApiFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,  // Token diverso!
  };

  // (stesso merge logic di apiFetch)
  if (options.headers) { ... }

  const hasBody = ...;
  const isFormData = ...;
  if (hasBody && !isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}
```

**Spiegazione:**
- Simile ad `apiFetch`, ma accetta un token diverso (e.g., GoCardless accessToken).
- Usato per endpoint bancari che richiedono un token separato da Supabase.
- Mantiene la stessa struttura per consistenza.

---

#### D. `buildQuery()` - Costruttore Query Params

```typescript
export function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}
```

**Spiegazione:**
- Converte un object di parametri in query string URL.
- `URLSearchParams` gestisce encoding correttamente.
- Ignora valori `undefined` e `null` (evita query params vuoti).
- Ritorna `"?key=value&key2=value2"` o `""` se vuoto.

**Esempio:**
```typescript
buildQuery({ startDate: "2026-01-01", endDate: "2026-01-31" })
// Ritorna: "?startDate=2026-01-01&endDate=2026-01-31"

buildQuery({ name: "Test", description: undefined })
// Ritorna: "?name=Test"  (description ignorato)

buildQuery({})
// Ritorna: ""
```

**Uso in context:**
```typescript
const query = buildQuery({ startDate, endDate });
const res = await apiFetch(`/income/all${query}`);
// Risultato: /income/all?startDate=2025-01-01&endDate=2026-01-08
```

---

## TanStack Query: Concetti Fondamentali

TanStack Query (React Query) è una libreria per il **data fetching, caching e sincronizzazione** in React.

### Concetti Chiave

| Concetto | Spiegazione |
|----------|-------------|
| **Query** | Fetch dati (GET). Cachato con `staleTime` e `gcTime`. |
| **Mutation** | Modificare dati (POST/PUT/DELETE). Trigger per invalidare cache. |
| **Query Key** | Identificatore univoco della query. `["users", { id: 1 }]` colla dati insieme. |
| **Stale Time** | Tempo prima che cache diventa "stale" (60s default). Query stale refetch automaticamente. |
| **GC Time** | Tempo prima che cache viene rimosso dalla memoria (5m default). |
| **Invalidation** | Invalida una query, forza refetch al prossimo uso. |
| **Retry** | Ritenta falliti automaticamente (1 volta default per query, 0 per mutation). |

---

## Setup e Provider

### QueryClient Configuration (`lib/providers/QueryProvider.tsx`)

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,           // 1 minuto
            gcTime: 5 * 60 * 1000,          // 5 minuti
            retry: 1,                        // Retry 1 volta su errore
            refetchOnWindowFocus: false,     // Non refetch al focus finestra
          },
          mutations: {
            retry: 0,                        // Non retry mutation
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Dettagli configurazione:**

1. **`useState` con lazy init**
   ```typescript
   const [queryClient] = useState(() => new QueryClient(...))
   ```
   - Crea `QueryClient` una volta al mount.
   - `useState(() => ...)` lazy initializer previene ricreazione.

2. **Query Default Options**
   - `staleTime: 60 * 1000` (1 min)
     - Cache è "fresh" per 60 secondi.
     - Dopo 60s, cache diventa "stale" ma rimane usabile.
     - Al prossimo render, se stale, refetch in background.
   
   - `gcTime: 5 * 60 * 1000` (5 min, formerly `cacheTime`)
     - Cache rimosso dopo 5 minuti di inattività.
     - Se query non viene usata per 5m, viene cancellata dalla memoria.
   
   - `retry: 1`
     - Se fetch fallisce, retry 1 volta.
     - Utile per errori di rete transitori.
   
   - `refetchOnWindowFocus: false`
     - Non refetch quando utente ritorna alla finestra.
     - Evita fetch unnecessary se user passa ad altra tab/app.

3. **Mutation Default Options**
   - `retry: 0`
     - Mutation (POST/PUT/DELETE) non retry.
     - User deve manualmente confirmare/retry.

4. **ReactQueryDevtools**
   - UI overlay in dev per debuggare queries/mutations.
   - `initialIsOpen={false}` nascosto di default (click icona in basso-destra).
   - Mostra: cache state, query keys, staleness, timing.

5. **QueryClientProvider**
   - Wrappa l'app per rendere `queryClient` disponibile.
   - Deve essere attivo prima di usare hook come `useQuery`.

### Wrappare App in Provider (`app/layout.tsx`)

```typescript
import { QueryProvider } from "@/lib/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Analytics />
          <SpeedInsights />
          <Toaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Ordine importante:** `QueryProvider` avvolge tutto per far funzionare tutti gli hook interni.

---

## Custom Hooks per Risorse

Tutti gli hook sono centralizzati in `lib/hooks/useQueries.ts`. Ciascun hook usa `useQuery` o `useMutation` con:
- **Query key** univoca e strutturata.
- **Query function** che chiama `apiFetch`.
- **Callbacks** per success/error.

### Query Keys Structure

```typescript
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
};
```

**Spiegazione:**
- **Key Hierarchy**: organizza chiavi in categorie (transactions, wallets, ecc.).
- **Specificity**: `all` per lista completa, `byDateRange()` per filtrate.
- **Invalidation Targeting**: invalida `["transactions"]` invalida tutte le varianti (all, byDateRange, ecc.).
- **as const**: TypeScript assicura chiavi immutabili.

**Esempio:**
```typescript
// Query 1: Tutte le transazioni
queryKey: ["transactions"]

// Query 2: Transazioni febbraio 2026
queryKey: ["transactions", { start: "2026-02-01", end: "2026-02-28" }]

// Quando invalidi ["transactions"], entrambe vengono invalidate
queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
```

---

### A. Hooks di Query (Read)

#### `useWallets()`

```typescript
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
```

**Spiegazione:**
- `queryKey: queryKeys.wallets.all` → chiave univoca `["wallets"]`.
- `queryFn` → funzione che fetcha i dati.
  - Chiama `apiFetch("/wallet")` (GET implicitamente).
  - Se `!res.ok` (status >= 400), lancia errore.
  - Altrimenti, parse JSON e ritorna array di Wallet.
- React Query automaticamente:
  - Cachja il risultato per 1 minuto.
  - Se stale, refetch in background.
  - Se errore, retry 1 volta.
  - Espone `{ data, isLoading, error, refetch, ... }`.

**Uso in Componente:**
```typescript
const { data: wallets = [], isLoading, error } = useWallets();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return wallets.map(w => <div key={w.id}>{w.name}</div>);
```

#### `useIncomes(startDate?, endDate?)`

```typescript
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
```

**Spiegazione:**
- **Parametri dinamici**: `startDate` e `endDate` cambiano la query key.
  - Se cambi date range, React Query usa una cache diversa (o ricarica).
- **Query builder**: `buildQuery({ startDate, endDate })` → `"?startDate=...&endDate=..."`
- **Lazy key**: `byDateRange(startDate, endDate)` ritorna:
  ```typescript
  ["incomes", { start: "2026-01-01", end: "2026-01-08" }]
  ```
- Quando utente cambia date picker, React Query automaticamente chiama `queryFn` di nuovo.

---

### B. Hooks di Mutation (Write)

#### `useCreateTransaction()`

```typescript
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
      // Invalida tutte le query correlate
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
```

**Spiegazione:**

1. **`useMutation` Hook**
   - Simile a `useQuery`, ma per operazioni di scrittura.
   - Ritorna `{ mutate, mutateAsync, isPending, isError, ... }`.

2. **`mutationFn`**
   - Funzione che effettua POST a `/transaction`.
   - Prende dati e ritorna risposta (o lancia errore).

3. **`onSuccess` Callback**
   - Eseguito quando `mutationFn` completa senza errori.
   - **Invalidazione cache**: invalida tutte le liste correlate.
   - Se invalidi `["transactions"]`, tutte le varianti (all, byDateRange) vengono ricaricate.
   - Mostrato toast di successo.

4. **`onError` Callback**
   - Eseguito se `mutationFn` lancia errore.
   - Mostrato toast di errore.

5. **`queryClient.invalidateQueries()`**
   - Marca una query come "stale" o la rimuove completamente.
   - Al prossimo render che usa quella query, React Query refetch.

**Uso in Componente:**
```typescript
const createTx = useCreateTransaction();

const handleSubmit = async (formData) => {
  createTx.mutate(formData, {
    onSuccess: () => {
      // Dialog chiude, form reset
    }
  });
};

return (
  <form onSubmit={handleSubmit}>
    ...
    <button disabled={createTx.isPending}>
      {createTx.isPending ? "Creating..." : "Create"}
    </button>
  </form>
);
```

#### `useUpdateTransaction()`

```typescript
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
```

**Differenze rispetto a Create:**
- `mutationFn` accetta `{ id, data }`.
- `apiFetch` con `PUT` e URL parametrizzato `/transaction/${id}`.
- Stessa invalidazione e callback.

#### `useDeleteTransaction()`

```typescript
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
```

**Simile a Update:**
- `mutationFn` accetta solo `id`.
- `apiFetch` con `DELETE`.

---

## Flusso Completo: Esempio Pratico

Vediamo il flusso completo da UI a cache, usando la pagina Incomes.

### Scenario: User clicca "Add Transaction"

**File:** `app/incomes/page.tsx`

```typescript
export default function Incomes() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({...});
  
  // 1. Fetch Entrate filtrate per data
  const { data: transactions = [], isLoading, refetch } = useIncomes(
    dateRange?.from?.toISOString().split("T")[0],
    dateRange?.to?.toISOString().split("T")[0]
  );

  return (
    <>
      <DynamicTable data={transactions} isLoading={isLoading} />
      
      {/* 2. Bottone che apre modal con form */}
      <NewTransaction onSuccess={() => refetch()} />
    </>
  );
}
```

**Step 1: useIncomes() Mount**
```
useIncomes("2026-01-01", "2026-01-08")
  ↓
queryKey = ["incomes", { start: "2026-01-01", end: "2026-01-08" }]
  ↓
React Query check cache → non trovato
  ↓
Execute queryFn:
  - buildQuery({ startDate: "2026-01-01", endDate: "2026-01-08" })
  - apiFetch("/income/all?startDate=2026-01-01&endDate=2026-01-08")
  - Aggiunge Authorization header
  - res.json()
  ↓
Cache result per 1 minuto
  ↓
Render: isLoading=false, data=[...incomes]
```

**Step 2: User submit form in NewTransaction**

```typescript
// components/new-transaction.tsx
export default function NewTransaction({ onSuccess }) {
  const { data: wallets } = useWallets();  // Fetch wallets
  const { data: categories } = useCategories();  // Fetch categories
  const createTx = useCreateTransaction();  // Mutation hook

  const handleSubmit = (formData) => {
    createTx.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();  // Callback da Incomes page
      }
    });
  };

  return <Drawer ...onSubmit={handleSubmit} />;
}
```

**Step 3: Mutation Executes**
```
createTx.mutate({ description, amount, date, ... })
  ↓
mutationFn executes:
  POST /transaction con body JSON
  Authorization header added (apiFetch)
  ↓
Server valida, salva nel DB, ritorna transazione
  ↓
onSuccess callback:
  - invalidateQueries(["transactions"])
    → Marca tutta la cache transactions come stale
  - invalidateQueries(["wallets"])
    → Marks wallets cache stale
  - invalidateQueries(["incomes"])
    → Marks incomes cache stale
  - toast.success("Transaction created")
  ↓
  - Chiama onSuccess() dalla Incomes page
    → refetch() ricarica la lista Entrate
```

**Step 4: Cache Invalidation e Refetch**
```
onSuccess completa
  ↓
React Query vede ["incomes"] invalidato
  ↓
useIncomes() hook riceve trigger di refetch
  ↓
queryFn rieseguito:
  apiFetch("/income/all?startDate=2026-01-01&endDate=2026-01-08")
  ↓
Nuovi dati fetchati
  ↓
Cache aggiornato
  ↓
Component re-render con nuovi dati
  ↓
UI aggiorna tabella
```

---

## Cache Invalidation Strategy

La strategia di invalidazione è **cascading**: quando modifichi una transazione, invalidi non solo le transazioni, ma anche Entrate, Spese e wallets.

### Perché?

Una transazione modifica:
- **Transazioni**: list deve aggiornarsi
- **Entrate/Spese**: se cambii il tipo (Income → Expense), le liste cambiano
- **Wallets**: se cambi l'importo o il wallet, il balance cambia

### Pattern di Invalidazione

```typescript
onSuccess: () => {
  // Invalida TUTTE le varianti della query
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  
  // Invalida liste Entrate e Spese (potrebbero cambiare)
  queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  
  // Invalida wallets (balance potrebbe cambiare)
  queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
  
  toast.success("Transaction updated");
}
```

### Invalidazione per Categoria

```typescript
// Quando modifica categoria, invalida solo categorie
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  toast.success("Category updated");
}
```

---

## Error Handling e Retry

### Retry Automatico

**Query** (Read):
```typescript
// Default: retry 1 volta
staleTime: 60 * 1000,
retry: 1,

// Se first fetch fallisce:
// 1. Retry automaticamente 1 volta
// 2. Se ancora fail, show error
```

**Mutation** (Write):
```typescript
// Default: no retry
mutations: {
  retry: 0,
}

// Se POST fallisce, mostra errore
// User deve manualmente retry (click submit again)
```

### Error Handling nei Hook

```typescript
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
      toast.success("Transaction deleted");
    },
    onError: (error) => {
      // error è l'exception da mutationFn
      toast.error("Failed to delete transaction");
      console.error("Delete error:", error);
    },
  });
}
```

### Uso in Componente

```typescript
const deleteDialog = useDeleteTransaction();

const handleDelete = () => {
  deleteDialog.mutate(selectedId, {
    onSuccess: () => {
      onClose();  // Chiudi dialog
    },
  });
};

return (
  <>
    <button onClick={handleDelete} disabled={deleteDialog.isPending}>
      {deleteDialog.isPending ? "Deleting..." : "Confirm Delete"}
    </button>
    {deleteDialog.isError && <div>Error: {deleteDialog.error?.message}</div>}
  </>
);
```

---

## Resoconto: Benefici del Sistema Centralizzato

| Aspetto | Beneficio |
|--------|----------|
| **Centralizzazione API** | Una sola fonte di verità per URL, headers, auth. Cambi una volta, aggiornamento globale. |
| **Fetch Helper** | Auto-token, auto-Content-Type, errore handling. Meno boilerplate. |
| **React Query** | Cache intelligente, refetch background, invalidazione cascading. UX fluido. |
| **Query Keys** | Invalidazione selettiva. Invalidi `["transactions"]`, tutte le varianti aggiornano. |
| **Mutations** | Separazione cleanRead vs Write. Retry logic disaccoppiato. |
| **Error & Success Callbacks** | Toast/UI update in un posto. UI aggiorna immediatamente. |
| **Devtools** | Debugging cache, query state, timing in dev. |

---

## Checklist: Come Aggiungere una Nuova Risorsa

Se devi aggiungere una nuova risorsa (es. `Budget`):

1. **Aggiungi Query Key**
   ```typescript
   budgets: {
     all: ["budgets"] as const,
   }
   ```

2. **Definisci Type**
   ```typescript
   export interface Budget extends Record<string, unknown> {
     id: string;
     name: string;
     limit: number;
     // ...
   }
   ```

3. **Crea Query Hook**
   ```typescript
   export function useBudgets() {
     return useQuery({
       queryKey: queryKeys.budgets.all,
       queryFn: async () => {
         const res = await apiFetch("/budget");
         if (!res.ok) throw new Error("Failed to fetch budgets");
         return res.json() as Promise<Budget[]>;
       },
     });
   }
   ```

4. **Crea Mutation Hook (CRUD)**
   ```typescript
   export function useCreateBudget() {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: async (data: Partial<Budget>) => {
         const res = await apiFetch("/budget", {
           method: "POST",
           body: JSON.stringify(data),
         });
         if (!res.ok) throw new Error("Failed to create budget");
         return res.json();
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
         toast.success("Budget created");
       },
       onError: () => {
         toast.error("Failed to create budget");
       },
     });
   }
   ```

5. **Usa Hook in Componente**
   ```typescript
   const { data: budgets, isLoading } = useBudgets();
   const createBudget = useCreateBudget();
   
   return (
     <>
       {isLoading ? <Spinner /> : budgets.map(b => <div key={b.id}>{b.name}</div>)}
       <button onClick={() => createBudget.mutate({ name: "Q1", limit: 5000 })}>
         Add Budget
       </button>
     </>
   );
   ```

---

## Conclusione

Il sistema di **API centralizzato + React Query** fornisce:
- **Coerenza**: tutti i fetch passano per `apiFetch` e `bankApiFetch`.
- **Caching intelligente**: evita ridondanti network request.
- **Sincronizzazione**: invalidazione cascading tiene dati sincronizzati.
- **DX**: meno boilerplate, errori gestiti, callback ben organizzati.
- **Debugging**: DevTools integrati per tracciare cache state e timing.

Questo è il fondamento di un'app robusta e performante!
