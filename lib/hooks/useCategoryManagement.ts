"use client";

/**
 * Hook della nuova pagina Categorie (13/11/2026): statistiche per categoria, regole visibili e
 * unione di due categorie. Le route stanno sul server: `GET /category/stats`, `/category-rules`,
 * `POST /category/:id/merge`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { errorFromResponse } from "@/lib/httpError";
import { parseListResponse } from "@/lib/listResponse";

export type CategoryStat = { movements: number; yearCents: number; lastUsed: string | null; rules: number };
export type CategoryRule = {
  id: number;
  keyword: string;
  type: "I" | "E";
  category_id: number;
  source: "manual" | "learned";
  updated_at?: string;
};

const keys = {
  stats: ["categories", "stats"] as const,
  rules: ["category-rules"] as const,
};

export function useCategoryStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: async () => {
      const res = await apiFetch("/category/stats");
      if (!res.ok) throw await errorFromResponse(res, "Failed to load the category stats");
      return (await res.json()) as { year: number; stats: Record<string, CategoryStat> };
    },
  });
}

export function useCategoryRules() {
  return useQuery({
    queryKey: keys.rules,
    queryFn: async () => {
      const res = await apiFetch("/category-rules");
      if (!res.ok) throw await errorFromResponse(res, "Failed to load the rules");
      return parseListResponse<CategoryRule>(await res.json()).rows;
    },
  });
}

/** Dopo una modifica: categorie, statistiche, regole e movimenti si rileggono. */
const useInvalidateAll = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    void queryClient.invalidateQueries({ queryKey: keys.rules });
    void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };
};

export function useCreateRule() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (data: { keyword: string; category_id: number }) => {
      const res = await apiFetch("/category-rules", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw await errorFromResponse(res, "Could not save the rule");
      return (await res.json()) as CategoryRule;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Rule saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save the rule"),
  });
}

export function useDeleteRule() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/category-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw await errorFromResponse(res, "Could not delete the rule");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Rule deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete the rule"),
  });
}

export function useMergeCategory() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ id, intoId }: { id: string; intoId: number }) => {
      const res = await apiFetch(`/category/${id}/merge`, { method: "POST", body: JSON.stringify({ into_id: intoId }) });
      if (!res.ok) throw await errorFromResponse(res, "Could not merge the categories");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Categories merged");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not merge the categories"),
  });
}
