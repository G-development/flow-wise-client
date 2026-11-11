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
import { useActiveCategories, useUpdateTransaction, type Transaction, type Wallet } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { absoluteAmount } from "@/lib/amount";
import { CapWarning } from "@/components/movements/cap-warning";
import {
  canTransferBetween,
  assignTransferSide,
  incomeExpenseTypeOf,
  isPendingTransfer,
  missingTransferSide,
  transferAsIncomeExpense,
} from "@/lib/transfer";

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
  // Righe in modalita' "Not a transfer": al posto del wallet si sceglie una categoria.
  const [asMovement, setAsMovement] = useState<Record<string, boolean>>({});
  const [categoryChoice, setCategoryChoice] = useState<Record<string, string>>({});
  const { data: categoryList = EMPTY_LIST_RESPONSE } = useActiveCategories();
  const [expanded, setExpanded] = useState(false);
  const pending = transfers.filter(isPendingTransfer);
  const shown = expanded ? pending : pending.slice(0, COLLAPSED_COUNT);

  if (pending.length === 0) return null;

  const walletName = (id: number | null | undefined) =>
    id == null ? "?" : wallets.find((w) => Number(w.id) === Number(id))?.name ?? `#${id}`;

  const clearRow = (id: string) => {
    for (const setter of [setChoice, setCategoryChoice]) {
      setter((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
    setAsMovement((current) => ({ ...current, [id]: false }));
  };

  // "Not a transfer": diventa spesa (se esce dal conto) o entrata (se entra), con la
  // categoria scelta. Il server ne impara la regola: i movimenti simili arrivano gia' cosi'.
  const convert = (transfer: Transaction) => {
    // "r:<id>" = rimborso di quella categoria di spesa (solo per un'entrata).
    const raw = categoryChoice[transfer.id] ?? "";
    const refund = raw.startsWith("r:");
    const categoryId = Number(refund ? raw.slice(2) : raw);
    if (!categoryId) return;
    updateTransaction.mutate(
      { id: transfer.id, data: transferAsIncomeExpense(transfer, categoryId, { refund }) },
      { onSuccess: () => clearRow(transfer.id) }
    );
  };

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
        moves once you assign it. If the money went to or came from an account you don&apos;t
        track, use &quot;Not a transfer&quot; to record it as an expense or income instead.
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
              {asMovement[transfer.id] ? (
                <div className="flex flex-col gap-2 sm:w-96">
                  <div className="flex gap-2">
                    <Select
                      value={categoryChoice[transfer.id]}
                      onValueChange={(value) => setCategoryChoice((current) => ({ ...current, [transfer.id]: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={incomeExpenseTypeOf(transfer) === "E" ? "Expense category…" : "Income category…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryList.rows
                          .filter((category) => category.type === incomeExpenseTypeOf(transfer))
                          .map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        {incomeExpenseTypeOf(transfer) === "I" &&
                          categoryList.rows
                            .filter((category) => category.type === "E")
                            .map((category) => (
                              <SelectItem key={`r-${category.id}`} value={`r:${category.id}`}>
                                Refund · {category.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => convert(transfer)}
                      disabled={!categoryChoice[transfer.id] || updateTransaction.isPending}
                    >
                      Save
                    </Button>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto self-end p-0 text-xs"
                    onClick={() => setAsMovement((current) => ({ ...current, [transfer.id]: false }))}
                  >
                    Back to transfer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:w-80">
                  <div className="flex gap-2">
                    <Select
                      value={choice[transfer.id]}
                      onValueChange={(value) => setChoice((current) => ({ ...current, [transfer.id]: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={side === "to" ? "To…" : "From…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets
                          .filter((w) => {
                            // Solo le coppie ammesse dal server: un salvadanaio solo con il suo conto.
                            const knownWallet = wallets.find((x) => Number(x.id) === Number(known));
                            return knownWallet ? canTransferBetween(knownWallet, w) : Number(w.id) !== Number(known);
                          })
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
                  {side === "to" && choice[transfer.id] && (
                    <CapWarning wallets={wallets} toWalletId={Number(choice[transfer.id])} amountEuro={absoluteAmount(transfer.amount)} />
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto self-end p-0 text-xs text-muted-foreground"
                    onClick={() => setAsMovement((current) => ({ ...current, [transfer.id]: true }))}
                  >
                    Not a transfer
                  </Button>
                </div>
              )}
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
