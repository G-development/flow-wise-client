import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { errorFromResponse } from "@/lib/httpError";
import { queryKeys, type Wallet } from "@/lib/hooks/useQueries";
import { effectiveCapCents } from "@/lib/potCap";

/**
 * Piano delle spese annuali (server: `routes/annualPlan.js`, migrazione 013). Gli importi
 * arrivano e partono in centesimi interi; la pagina li mostra in euro.
 */

export type AnnualInstallment = {
  id: number;
  item_id: number;
  due_date: string;
  amount_cents: number;
  transaction_id: number | null;
  paid: boolean;
};

export type AnnualItem = {
  id: number;
  name: string;
  pot_wallet_id: number;
  active: boolean;
  note: string | null;
  installments: AnnualInstallment[];
};

export type AnnualPlan = {
  balanceCents: number;
  shortfallNowCents: number;
  suggestedMonthlyCents: number;
  capCents: number | null;
  capConflict: boolean;
  negativeMonths: number[];
  projection: { month: number; dueCents: number; balanceCents: number }[];
};

export type AnnualPlanResponse = {
  wallet: { id: number; name: string };
  today: string;
  plan: AnnualPlan;
  items: AnnualItem[];
};

const annualKeys = {
  all: ["annual"] as const,
  plan: (walletId: number | null) => ["annual", "plan", walletId] as const,
};

async function fetchPlan(walletId: number): Promise<AnnualPlanResponse> {
  const res = await apiFetch(`/annual-plan?walletId=${walletId}`);
  if (!res.ok) throw await errorFromResponse(res, "Failed to load the annual plan");
  return res.json();
}

/** Il piano di un salvadanaio (voci, rate, quota consigliata, tetto, proiezione). */
export function useAnnualPlan(walletId: number | null) {
  return useQuery({
    queryKey: annualKeys.plan(walletId),
    queryFn: () => fetchPlan(walletId as number),
    enabled: walletId != null,
  });
}

/** I piani di piu' salvadanai insieme (card di Movements): uno per id, in quell'ordine. */
export function useAnnualPlans(walletIds: number[]) {
  return useQueries({
    queries: walletIds.map((walletId) => ({
      queryKey: annualKeys.plan(walletId),
      queryFn: () => fetchPlan(walletId),
      retry: 1,
    })),
  });
}

// Il piano dipende dai saldi (wallet) e dai pagamenti (transazioni): ogni scrittura lo rilegge.
function invalidateAnnual(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: annualKeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
}

function useAnnualMutation<V>(request: (vars: V) => Promise<Response>, failure: string, success?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: V) => {
      const res = await request(vars);
      if (!res.ok) throw await errorFromResponse(res, failure);
      return res.json();
    },
    onSuccess: () => {
      invalidateAnnual(queryClient);
      if (success) toast.success(success);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export function useCreateAnnualItem() {
  return useAnnualMutation(
    (data: { name: string; pot_wallet_id: number; installments: { due_date: string; amount_cents: number }[] }) =>
      apiFetch("/annual-items", json("POST", data)),
    "Failed to create the item",
    "Item created"
  );
}

export function useUpdateAnnualItem() {
  return useAnnualMutation(
    ({ id, data }: { id: number; data: Partial<Pick<AnnualItem, "name" | "note" | "active" | "pot_wallet_id">> }) =>
      apiFetch(`/annual-items/${id}`, json("PUT", data)),
    "Failed to update the item"
  );
}

export function useDeleteAnnualItem() {
  return useAnnualMutation((id: number) => apiFetch(`/annual-items/${id}`, json("DELETE")), "Failed to delete the item", "Item deleted");
}

export function useAddInstallment() {
  return useAnnualMutation(
    ({ itemId, data }: { itemId: number; data: { due_date: string; amount_cents: number } }) =>
      apiFetch(`/annual-items/${itemId}/installments`, json("POST", data)),
    "Failed to add the installment"
  );
}

export function useUpdateInstallment() {
  return useAnnualMutation(
    ({ id, data }: { id: number; data: { due_date?: string; amount_cents?: number } }) =>
      apiFetch(`/annual-installments/${id}`, json("PUT", data)),
    "Failed to update the installment"
  );
}

export function useDeleteInstallment() {
  return useAnnualMutation((id: number) => apiFetch(`/annual-installments/${id}`, json("DELETE")), "Failed to delete the installment");
}

export function useCopyNextYear() {
  return useAnnualMutation(
    (itemId: number) => apiFetch(`/annual-items/${itemId}/copy-next-year`, json("POST")),
    "Failed to copy the installments",
    "Installments copied one year ahead: check them"
  );
}

export function useSetInstallmentPayment() {
  return useAnnualMutation(
    ({ id, transactionId }: { id: number; transactionId: number | null }) =>
      apiFetch(`/annual-installments/${id}/payment`, json("PUT", { transaction_id: transactionId })),
    "Failed to update the payment"
  );
}

/**
 * Il tetto in vigore di ogni salvadanaio (centesimi, per id), per le card e gli avvisi. Per un
 * tetto "dal piano" serve il piano; se non si carica (es. migrazione 013 non applicata) il
 * tetto risulta assente e nessun avviso compare.
 */
export function usePotCaps(wallets: Wallet[]) {
  const pots = wallets.filter((wallet) => wallet.kind === "pot");
  const plans = useAnnualPlans(pots.map((pot) => Number(pot.id)));
  const caps = new Map<string, number | null>();
  const planById = new Map<string, AnnualPlanResponse | undefined>();
  pots.forEach((pot, index) => {
    const plan = plans[index]?.data;
    planById.set(String(pot.id), plan);
    caps.set(String(pot.id), effectiveCapCents(pot, plan?.plan.capCents));
  });
  return { caps, planById };
}
