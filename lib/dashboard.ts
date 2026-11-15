/**
 * Calcoli della dashboard fissa (16/11/2026): confronto con il periodo precedente, spese per
 * categoria, ritmo delle spese, cose da sistemare nel periodo, rate in arrivo.
 *
 * Funzioni pure per `node --test`. Importi come in `lib/amount.ts`: `amount` >= 0, il segno lo da'
 * `type`; un rimborso ("I" con `is_refund`) e' una spesa in meno della sua categoria.
 */

import { absoluteAmount, isRefund } from "./amount.ts";

type Movement = {
  type?: string | null;
  is_refund?: boolean | null;
  amount: unknown;
  date?: unknown;
  category_id?: unknown;
  wallet_id?: unknown;
  to_wallet_id?: unknown;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const dayOf = (value: unknown) => String(value ?? "").slice(0, 10);
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Movimenti con data tra `from` e `to` (giorni compresi). */
export function inRange<M extends { date?: unknown }>(movements: readonly M[], from: Date, to: Date): M[] {
  const a = isoDay(from);
  const b = isoDay(to);
  return movements.filter((m) => {
    const day = dayOf(m.date);
    return day >= a && day <= b;
  });
}

/**
 * Variazione percentuale da `previous` a `current`; null quando non ha senso (prima nulla o
 * negativa, per esempio un mese con piu' rimborsi che spese).
 */
export function percentChange(current: number, previous: number): number | null {
  if (!(previous > 0)) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Spesa netta di un movimento (positiva per una spesa, negativa per un rimborso, 0 altrimenti). */
export function expenseAmount(movement: Movement): number {
  const amount = absoluteAmount(movement.amount);
  if (isRefund(movement)) return -amount;
  return movement.type === "E" ? amount : 0;
}

export type CategorySpend = { categoryId: string; amount: number; previous: number; change: number | null };

/**
 * Spese nette per categoria nel periodo, con quanto si era speso nel periodo di confronto.
 * Solo le categorie con una spesa positiva adesso, dalla piu' alta.
 */
export function categorySpending(current: readonly Movement[], previous: readonly Movement[] = []): CategorySpend[] {
  const sum = (list: readonly Movement[]) => {
    const map = new Map<string, number>();
    for (const m of list) {
      const value = expenseAmount(m);
      if (value === 0) continue;
      const key = String(m.category_id ?? "");
      map.set(key, (map.get(key) ?? 0) + value);
    }
    return map;
  };
  const now = sum(current);
  const before = sum(previous);
  return [...now.entries()]
    .map(([categoryId, amount]) => {
      const prev = round2(before.get(categoryId) ?? 0);
      const value = round2(amount);
      return { categoryId, amount: value, previous: prev, change: percentChange(value, prev) };
    })
    .filter((row) => row.amount > 0.005)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Spese cumulate giorno per giorno da `from`, per `days` giorni: il valore i-esimo e' quanto si e'
 * speso dall'inizio fino al giorno i compreso. Serve alla linea del ritmo.
 */
export function cumulativeSpending(movements: readonly Movement[], from: Date, days: number): number[] {
  const byDay = new Map<string, number>();
  for (const m of movements) {
    const value = expenseAmount(m);
    if (value !== 0) byDay.set(dayOf(m.date), (byDay.get(dayOf(m.date)) ?? 0) + value);
  }
  const out: number[] = [];
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    total += byDay.get(isoDay(day)) ?? 0;
    out.push(round2(total));
  }
  return out;
}

/** Trasferimenti da assegnare (un lato vuoto) con la data nel periodo; senza periodo, tutti. */
export function pendingTransfersIn<M extends Movement>(transfers: readonly M[], range?: { from: Date; to: Date }): M[] {
  const pending = transfers.filter(
    (t) => t.type === "T" && ((t.wallet_id ?? null) === null) !== ((t.to_wallet_id ?? null) === null)
  );
  return range ? inRange(pending, range.from, range.to) : pending;
}

export type UpcomingDue = {
  itemName: string;
  potName: string;
  dueDate: string;
  amountCents: number;
  overdue: boolean;
};

type PlanLike = {
  wallet: { name: string };
  items: { name: string; active: boolean; installments: { due_date: string; amount_cents: number; paid: boolean }[] }[];
};

/**
 * Rate non pagate del piano annuale, dalla piu' vicina: prima quelle gia' scadute (`overdue`), poi
 * le prossime. `limit` righe al massimo. Il piano resta a mesi di calendario (scelta di Gio, 16/11).
 */
export function upcomingDues(plans: readonly PlanLike[], today: Date, limit = 4): UpcomingDue[] {
  const todayIso = isoDay(today);
  const rows: UpcomingDue[] = [];
  for (const plan of plans) {
    for (const item of plan.items) {
      if (!item.active) continue;
      for (const installment of item.installments) {
        if (installment.paid) continue;
        rows.push({
          itemName: item.name,
          potName: plan.wallet.name,
          dueDate: installment.due_date,
          amountCents: installment.amount_cents,
          overdue: installment.due_date < todayIso,
        });
      }
    }
  }
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, limit);
}
