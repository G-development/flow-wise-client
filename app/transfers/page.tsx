"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import DeleteDialog from "@/components/delete-dialog";
import { DynamicTable } from "@/components/dynamic-table";
import { TruncatedNotice } from "@/components/truncated-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTransfers,
  useWallets,
  useUpdateTransaction,
  useDeleteTransaction,
  type Transaction,
} from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { absoluteAmount } from "@/lib/amount";
import { assignTransferSide, isPendingTransfer, missingTransferSide } from "@/lib/transfer";
import { ArrowLeftRight, Plus, Trash } from "lucide-react";

const formatAmount = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const formatDate = (date: string) => new Date(date).toLocaleDateString("it-IT");

/**
 * Trasferimenti tra wallet (type "T"): giroconti conto <-> salvadanaio e conto <-> conto.
 *
 * In alto quelli "da assegnare": dalla banca arriva il lato del conto, il salvadanaio lo
 * sceglie Gio. Finché non è scelto, il saldo del conto è già giusto e quello del
 * salvadanaio non si muove (server, `utils/amount.js` `walletDeltasCents`).
 */
export default function Transfers() {
  const { data: transferList = EMPTY_LIST_RESPONSE, isLoading, isError } = useTransfers();
  const { data: wallets = [] } = useWallets();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [choice, setChoice] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transfers = transferList.rows as Transaction[];
  const pending = transfers.filter(isPendingTransfer);
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
    <>
      <Navbar />
      <main className="app-page">
        <div className="app-page-header">
          <div>
            <h1 className="page-title">Transfers</h1>
            <p className="page-description">
              Money moved between your wallets and savings pots: not income, not expense
            </p>
          </div>
          <NewTransaction
            defaultType="T"
            trigger={
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Transfer
              </Button>
            }
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading transfers...</p>
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-destructive font-medium">Error loading transfers</p>
          </div>
        )}

        {!isLoading && !isError && transferList.truncated && (
          <TruncatedNotice shown={transferList.count} total={transferList.total} className="mb-4" />
        )}

        {!isLoading && !isError && pending.length > 0 && (
          <section className="mb-8 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold">Da assegnare ({pending.length})</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Scegli il wallet mancante: il saldo del conto è già aggiornato, quello del salvadanaio
              lo sarà quando assegni.
            </p>
            <ul className="divide-y divide-border/70">
              {pending.map((transfer) => {
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
                        {side === "to"
                          ? `da ${walletName(known)} verso ?`
                          : `da ? verso ${walletName(known)}`}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:w-80">
                      <Select
                        value={choice[transfer.id]}
                        onValueChange={(value) => setChoice((current) => ({ ...current, [transfer.id]: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={side === "to" ? "Verso…" : "Da…"} />
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
                        Assegna
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!isLoading && !isError && transfers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <ArrowLeftRight className="mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-muted-foreground">No transfers yet</p>
          </div>
        )}

        {!isLoading && !isError && transfers.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <DynamicTable
              data={transfers.map((transfer) => ({
                Id: transfer.id,
                Date: formatDate(transfer.date),
                Description: transfer.description,
                From: walletName(transfer.wallet_id),
                To: walletName(transfer.to_wallet_id),
                Amount: formatAmount.format(absoluteAmount(transfer.amount)),
                Status: isPendingTransfer(transfer) ? (
                  <Badge variant="outline">Da assegnare</Badge>
                ) : null,
              }))}
              hiddenColumns={["Id"]}
              caption={`Hai ${transfers.length} trasferiment${transfers.length === 1 ? "o" : "i"}.`}
              renderActions={(row) => (
                <div className="flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(String(row.Id))}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Elimina</span>
                  </Button>
                </div>
              )}
            />
          </div>
        )}
      </main>

      <DeleteDialog
        isOpen={deleteId !== null}
        title="Delete transfer"
        description="The transfer is removed and both wallet balances go back as before. This cannot be undone."
        onClose={() => setDeleteId(null)}
        isPending={deleteTransaction.isPending}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteTransaction.mutateAsync(deleteId);
          } finally {
            setDeleteId(null);
          }
        }}
      />
    </>
  );
}
