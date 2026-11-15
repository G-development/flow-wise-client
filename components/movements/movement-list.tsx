"use client";

import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { CategoryAvatar } from "@/lib/categoryStyle";
import { absoluteAmount } from "@/lib/amount";
import { movementDirection, type DayGroup } from "@/lib/movements";
import type { Category, Transaction, Wallet } from "@/lib/hooks/useQueries";

export const formatEuro = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);

/** "Today", "Yesterday" o "Fri 14 Nov" (anno solo se diverso da quello corrente). */
export function dayLabel(day: string) {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Titolo leggibile di un movimento: il nome che il server ricava per la banca, o la descrizione. */
export const movementTitle = (movement: Transaction) =>
  String(movement.merchant || movement.description || "No description");

/**
 * Elenco dei movimenti per giorno (ridisegno di Movements, 15/11/2026): intestazione del giorno
 * con il saldo, righe con icona della categoria, nome leggibile, categoria e wallet, importo.
 * Un tocco apre il dettaglio (`onOpen`).
 */
export function MovementDayList({
  groups,
  categories,
  wallets,
  singleWalletId,
  onOpen,
}: {
  groups: DayGroup<Transaction>[];
  categories: Map<string, Category>;
  wallets: Map<string, Wallet>;
  singleWalletId: string | null;
  onOpen: (movement: Transaction) => void;
}) {
  const walletName = (id: unknown) => (id == null ? "?" : wallets.get(String(id))?.name ?? `#${String(id)}`);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.day} aria-label={dayLabel(group.day)}>
          <div className="mb-1.5 flex items-baseline justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel(group.day)}</h3>
            {group.net !== 0 && (
              <span className={`text-xs font-medium tabular-nums ${group.net > 0 ? "text-success" : "text-muted-foreground"}`}>
                {group.net > 0 ? "+ " : "− "}
                {formatEuro(Math.abs(group.net))}
              </span>
            )}
          </div>
          <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            {group.items.map((movement) => {
              const category = categories.get(String(movement.category_id));
              const direction = movementDirection(movement, singleWalletId);
              const isTransfer = movement.type === "T";
              const sign = direction === "in" ? "+ " : direction === "out" ? "− " : "";
              const amountClass =
                direction === "in" ? "text-success" : direction === "out" ? "text-foreground" : "text-muted-foreground";
              return (
                <button
                  key={movement.id}
                  type="button"
                  onClick={() => onOpen(movement)}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60 sm:px-4"
                >
                  {isTransfer ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <ArrowLeftRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <CategoryAvatar category={category} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{movementTitle(movement)}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">
                        {isTransfer
                          ? `${walletName(movement.wallet_id)} → ${movement.to_wallet_id == null ? "to assign" : walletName(movement.to_wallet_id)}`
                          : `${category?.name ?? "No category"} · ${walletName(movement.wallet_id)}`}
                      </span>
                      {movement.is_refund && (
                        <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          Refund
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${amountClass}`}>
                    {sign}
                    {formatEuro(absoluteAmount(movement.amount))}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 sm:block" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
