"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMovements, useUpdateTransaction, type Category, type Transaction } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();

/**
 * Categorie "da sistemare" (13/11/2026): quelle di ripiego ("Altro" / "Other") e quelle che nel nome
 * dicono che vanno ancora classificate ("… da classificare", "to classify", "to review").
 * Regola sul nome, non sull'utente: vale per chiunque abbia categorie cosi'.
 */
export function isReviewCategory(name: string): boolean {
  const n = normalize(name);
  return n === "altro" || n === "other" || /\b(da classificare|to classify|to review)\b/.test(n);
}

const PAGE = 40;

/**
 * Movimenti ancora in una categoria da sistemare, dal piu' recente: per ognuno si sceglie la
 * categoria giusta (dello stesso tipo) e il movimento sparisce dall'elenco. Per i movimenti arrivati
 * dalla banca il server impara anche la regola (`PUT /transaction/:id`), cosi' i prossimi arrivano
 * gia' giusti.
 */
export function ReviewSheet({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const { data: list = EMPTY_LIST_RESPONSE, isLoading } = useMovements();
  const update = useUpdateTransaction();
  const [shown, setShown] = useState(PAGE);
  const [done, setDone] = useState<Set<string>>(new Set());

  const reviewIds = useMemo(
    () => new Set(categories.filter((c) => isReviewCategory(String(c.name))).map((c) => String(c.id))),
    [categories]
  );
  const nameOf = useMemo(() => new Map(categories.map((c) => [String(c.id), String(c.name)])), [categories]);

  const pending = useMemo(
    () =>
      (list.rows as Transaction[])
        .filter((t) => reviewIds.has(String(t.category_id)) && !done.has(String(t.id)))
        .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [list.rows, reviewIds, done]
  );

  const optionsFor = (t: Transaction) => {
    // un rimborso e' un'entrata con una categoria di spesa: per lui valgono le categorie di spesa
    const type = t.is_refund ? "E" : t.type;
    return categories
      .filter((c) => c.type === type && c.active !== false && !reviewIds.has(String(c.id)))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  };

  const assign = (t: Transaction, categoryId: string) => {
    update.mutate(
      {
        id: String(t.id),
        data: {
          description: t.description,
          note: t.note,
          amount: t.amount,
          date: t.date,
          type: t.type,
          wallet_id: t.wallet_id,
          to_wallet_id: t.to_wallet_id,
          category_id: Number(categoryId),
          ...(t.is_refund ? { is_refund: true } : {}),
        },
      },
      { onSuccess: () => setDone((prev) => new Set(prev).add(String(t.id))) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>To review</SheetTitle>
          <SheetDescription>
            Movements still in a fallback category. Pick the right one: bank movements also teach Flow Wise a rule.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <Check className="mx-auto mb-2 h-6 w-6 text-success" />
            Nothing left to review.
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <p className="text-xs text-muted-foreground">{pending.length} to go</p>
            {pending.slice(0, shown).map((t) => (
              <div key={t.id} className="rounded-xl border border-border/70 bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{t.description || "No description"}</p>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === "I" ? "text-success" : ""}`}>
                    {t.type === "I" ? "+" : "−"}
                    {Math.abs(Number(t.amount)).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(String(t.date)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {nameOf.get(String(t.category_id))}
                  {t.is_refund ? " · refund" : ""}
                </p>
                <Select onValueChange={(value) => assign(t, value)} disabled={update.isPending}>
                  <SelectTrigger className="mt-2 h-9" aria-label={`Category for ${t.description || "movement"}`}>
                    <SelectValue placeholder="Move to…" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsFor(t).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {pending.length > shown && (
              <Button variant="outline" className="w-full" onClick={() => setShown(shown + PAGE)}>
                Show more ({pending.length - shown})
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
