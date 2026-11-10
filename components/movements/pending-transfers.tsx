"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTransaction, type Transaction, type Wallet } from "@/lib/hooks/useQueries";
import { absoluteAmount } from "@/lib/amount";
import { assignTransferSide, isPendingTransfer, missingTransferSide } from "@/lib/transfer";

/** Quanti trasferimenti mostrare prima di "Show all": il riquadro non deve coprire la pagina. */
const COLLAPSED_COUNT = 3;

const formatAmount = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const formatDate = (date: string) => new Date(date).toLocaleDateString("it-IT");

/**
 * Trasferimenti "da assegnare": dalla banca arriva il lato del conto, l'altro lo sceglie
 * l'utente. Finché non è scelto, il saldo del conto è già giusto e quello dell'altro
 * wallet non si muove (server, `utils/amount.js` `walletDeltasCents`).
 *
 * Riceve tutti i trasferimenti, non solo quelli del periodo: un accantonamento vecchio
 * ancora da assegnare non deve sparire cambiando le date.
 */
export function PendingTransfers({
  transfers,
  wallets,
}: {
  transfers: Transaction[];
  wallets: Wallet[];
}) {
  const updateTransaction = useUpdateTransaction();
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const pending = transfers.filter(isPendingTransfer);
  const shown = expanded ? pending : pending.slice(0, COLLAPSED_COUNT);

  if (pending.length === 0) return null;

  const walletName = (id: number | null | undefined) =>
    id == null ? "?" : wallets.find((w) => Number(w.id) === Number(id))?.name ?? `#${id}`;

  const assign = (transfer: Transaction) => {
    const walletId = Number(choice[transfer.id]);
    if (!walletId) return;
    updateTransaction.mutate(
      { id: transfer.id, data: assignTransferSide(transfer, walletId) },
      {
        onSuccess: () =>
          setChoice((current) => {
            const next = { ...current };
            delete next[transfer.id];
            return next;
          }),
      }
    );
  };

  return (
    <section className="mb-6 rounded-xl border border-amber-500/30 bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">Transfers to assign ({pending.length})</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick the missing wallet. The account balance is already up to date; the other wallet
        moves once you assign it.
      </p>
      <ul className="divide-y divide-border/70">
        {shown.map((transfer) => {
          const side = missingTransferSide(transfer);
          const known = side === "to" ? transfer.wallet_id : transfer.to_wallet_id;
          return (
            <li
              key={transfer.id}
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{transfer.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transfer.date)} · {formatAmount.format(absoluteAmount(transfer.amount))} ·{" "}
                  {side === "to" ? `from ${walletName(known)} to ?` : `from ? to ${walletName(known)}`}
                </p>
              </div>
              <div className="flex gap-2 sm:w-80">
                <Select
                  value={choice[transfer.id]}
                  onValueChange={(value) => setChoice((current) => ({ ...current, [transfer.id]: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={side === "to" ? "To…" : "From…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter((w) => Number(w.id) !== Number(known))
                      .map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => assign(transfer)}
                  disabled={!choice[transfer.id] || updateTransaction.isPending}
                >
                  Assign
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {pending.length > COLLAPSED_COUNT && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : `Show all (${pending.length})`}
        </Button>
      )}
    </section>
  );
}
