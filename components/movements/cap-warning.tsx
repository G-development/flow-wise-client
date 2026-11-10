"use client";

import { AlertTriangle } from "lucide-react";
import type { Wallet } from "@/lib/hooks/useQueries";
import { usePotCaps } from "@/lib/hooks/useAnnualPlan";
import { overCapCents } from "@/lib/potCap";

const euro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

/**
 * Avviso non bloccante: il versamento porterebbe il salvadanaio `toWalletId` sopra il suo tetto.
 * `amountEuro` e' l'importo che entra e non e' ancora contato nel saldo (trasferimento nuovo o
 * da assegnare).
 */
export function CapWarning({ wallets, toWalletId, amountEuro }: { wallets: Wallet[]; toWalletId: number | null; amountEuro: number }) {
  const { caps } = usePotCaps(wallets);
  const pot = wallets.find((wallet) => Number(wallet.id) === Number(toWalletId) && wallet.kind === "pot");
  if (!pot) return null;
  const over = overCapCents(Number(pot.balance), amountEuro, caps.get(String(pot.id)) ?? null);
  if (over <= 0) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      {pot.name} would go {euro(over)} over its cap of {euro(caps.get(String(pot.id)) ?? 0)}.
    </p>
  );
}
