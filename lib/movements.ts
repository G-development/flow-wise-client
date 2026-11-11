/**
 * Filtri e totali della pagina Movements (entrate, spese e trasferimenti insieme).
 *
 * Funzioni pure, senza React, per poterle provare con `node --test`. Gli importi seguono
 * `lib/amount.ts`: `amount` è sempre >= 0 e il segno lo decide `type`. Un trasferimento
 * ("T") sposta `amount` da `wallet_id` a `to_wallet_id`; un lato vuoto è "da assegnare"
 * (`lib/transfer.ts`).
 */

import { absoluteAmount, isRefund } from "./amount.ts";

export type MovementType = "I" | "E" | "T";
export const MOVEMENT_TYPES: readonly MovementType[] = ["I", "E", "T"];

type MovementLike = {
  type?: string | null;
  is_refund?: boolean | null;
  amount: unknown;
  wallet_id?: number | string | null;
  to_wallet_id?: number | string | null;
};

/**
 * Filtri della pagina. `wallets: null` vuol dire "tutti i wallet": così un wallet creato
 * dopo che il filtro è stato salvato nell'indirizzo compare comunque.
 */
export type MovementFilters = {
  types: ReadonlySet<MovementType>;
  wallets: ReadonlySet<string> | null;
};

export const DEFAULT_FILTERS: MovementFilters = { types: new Set(MOVEMENT_TYPES), wallets: null };

const isMovementType = (value: string): value is MovementType =>
  (MOVEMENT_TYPES as readonly string[]).includes(value);

/**
 * Legge i filtri dall'indirizzo (`?types=I,E&wallets=1,11`). Valori sconosciuti vengono
 * ignorati; un `types` vuoto o tutto sconosciuto torna a "tutti i tipi", un `wallets`
 * vuoto a "tutti i wallet", così un link vecchio o sbagliato non mostra mai una pagina vuota.
 */
export function parseMovementFilters(params: { get(name: string): string | null }): MovementFilters {
  const types = (params.get("types") ?? "").split(",").map((v) => v.trim()).filter(isMovementType);
  const wallets = (params.get("wallets") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  return {
    types: types.length > 0 ? new Set(types) : new Set(MOVEMENT_TYPES),
    wallets: wallets.length > 0 ? new Set(wallets) : null,
  };
}

/** Parametri d'indirizzo per i filtri; quelli uguali al default non vengono scritti. */
export function serializeMovementFilters(filters: MovementFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.types.size > 0 && filters.types.size < MOVEMENT_TYPES.length) {
    params.set("types", MOVEMENT_TYPES.filter((t) => filters.types.has(t)).join(","));
  }
  if (filters.wallets !== null) {
    params.set("wallets", [...filters.wallets].sort().join(","));
  }
  return params;
}

/** Il movimento tocca il wallet? Una "T" lo tocca se è l'origine o la destinazione. */
export function touchesWallet(movement: MovementLike, walletId: string): boolean {
  if (String(movement.wallet_id ?? "") === walletId) return true;
  return movement.type === "T" && String(movement.to_wallet_id ?? "") === walletId;
}

/** Tipo per i filtri: un rimborso sta con le spese ("E"), perché le riduce. */
export function movementFilterType(movement: MovementLike): string {
  return isRefund(movement) ? "E" : String(movement.type);
}

export function filterMovements<M extends MovementLike>(movements: readonly M[], filters: MovementFilters): M[] {
  return movements.filter((movement) => {
    const type = movementFilterType(movement);
    if (!isMovementType(type) || !filters.types.has(type)) return false;
    if (filters.wallets === null) return true;
    return [...filters.wallets].some((walletId) => touchesWallet(movement, walletId));
  });
}

export type MovementTotals = {
  income: number;
  expense: number;
  /** income − expense: i trasferimenti non sono né entrate né spese */
  net: number;
  /** solo con un singolo wallet: trasferimenti entrati in / usciti da quel wallet */
  transfersIn: number | null;
  transfersOut: number | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Totali di un elenco già filtrato. Con `singleWalletId` calcola anche quanto è entrato e
 * uscito da quel wallet con i trasferimenti (una "T" da assegnare conta solo dal lato noto).
 */
export function movementTotals(movements: readonly MovementLike[], singleWalletId: string | null = null): MovementTotals {
  let income = 0;
  let expense = 0;
  let transfersIn = 0;
  let transfersOut = 0;
  for (const movement of movements) {
    const amount = absoluteAmount(movement.amount);
    if (isRefund(movement)) expense -= amount;
    else if (movement.type === "I") income += amount;
    else if (movement.type === "E") expense += amount;
    else if (movement.type === "T" && singleWalletId !== null) {
      if (String(movement.to_wallet_id ?? "") === singleWalletId) transfersIn += amount;
      if (String(movement.wallet_id ?? "") === singleWalletId) transfersOut += amount;
    }
  }
  return {
    income: round2(income),
    expense: round2(expense),
    net: round2(income - expense),
    transfersIn: singleWalletId === null ? null : round2(transfersIn),
    transfersOut: singleWalletId === null ? null : round2(transfersOut),
  };
}

/** Entrate e spese di un wallet nel periodo: i numeri delle card in cima alla pagina. */
export function walletPeriodTotals(movements: readonly MovementLike[], walletId: string) {
  const totals = movementTotals(
    movements.filter((movement) => movement.type !== "T" && touchesWallet(movement, walletId))
  );
  return { income: totals.income, expense: totals.expense };
}

/**
 * Come mostrare l'importo in tabella. Entrata "+", spesa "−"; un trasferimento è neutro,
 * tranne quando la pagina guarda un solo wallet: lì esce ("−") o entra ("+") da quel wallet.
 */
export function movementDirection(movement: MovementLike, singleWalletId: string | null = null): "in" | "out" | "neutral" {
  if (movement.type === "I") return "in";
  if (movement.type === "E") return "out";
  if (singleWalletId !== null) {
    if (String(movement.to_wallet_id ?? "") === singleWalletId) return "in";
    if (String(movement.wallet_id ?? "") === singleWalletId) return "out";
  }
  return "neutral";
}
