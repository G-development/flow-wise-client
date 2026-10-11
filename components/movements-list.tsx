"use client";

import { useMemo, useState } from "react";
import {
  useWallets,
  useCategories,
  useDeleteTransaction,
  type Transaction,
} from "@/lib/hooks/useQueries";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import { TruncatedNotice } from "@/components/truncated-notice";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";
import { useDateRange } from "@/lib/providers/DateRangeProvider";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { absoluteAmount } from "@/lib/amount";

/**
 * Lista movimenti condivisa dalle pagine /incomes e /expenses.
 *
 * E' l'unico punto in cui vive la logica (mappatura righe, badge categoria,
 * azioni di modifica/eliminazione). Le due pagine differiscono solo per:
 * hook dati (chiamato dalla pagina, che passa `transactions`), titolo,
 * descrizione, prefisso della caption e wrapper di layout esterno.
 */
export interface MovementsListProps {
  /** Titolo visibile (h1). */
  title: string;
  /** Descrizione sotto il titolo. */
  description: string;
  /** Prima parola della caption: "<captionPrefix> transactions shown from ... to ...". */
  captionPrefix: string;
  /** Movimenti già risolti dal chiamante: la pagina possiede l'hook dati. */
  transactions: Transaction[];
  /** `true` quando il server ha tagliato il set al tetto di paginazione. */
  truncated?: boolean;
  /** Righe totali del periodo secondo il server; `null` se non dichiarate. */
  total?: number | null;
  isLoading: boolean;
  onRefetch: () => void;
}

export function MovementsList({
  title,
  description,
  captionPrefix,
  transactions,
  truncated = false,
  total = null,
  isLoading,
  onRefetch,
}: MovementsListProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { dateRange, setDateRange } = useDateRange();

  const { data: wallets = [] } = useWallets();
  const { data: categoryList = EMPTY_LIST_RESPONSE } = useCategories();
  // La risposta e' l'envelope di lista: le righe stanno in `rows`.
  const categories = categoryList.rows;
  const deleteTransaction = useDeleteTransaction();

  const rows = useMemo(() => {
    const walletMap = new Map(wallets.map((w) => [String(w.id), w.name]));
    const categoryMap = new Map(
      categories.map((c) => [String(c.id), { name: c.name, type: c.type }])
    );

    const formatAmount = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    });

    const getField = (obj: Record<string, unknown>, key: string) => {
      const val = obj[key];
      if (typeof val === "string" || typeof val === "number") return String(val);
      return "";
    };

    return transactions.map((tx) => {
      const txObj = tx as Record<string, unknown>;
      const walletId = getField(txObj, "wallet_id") || getField(txObj, "walletid");
      const categoryId = getField(txObj, "category_id") || getField(txObj, "category");
      const walletName = walletMap.get(walletId) ?? "-";
      const categoryInfo = categoryMap.get(categoryId);
      const categoryName = categoryInfo?.name ?? "-";
      const categoryType = categoryInfo?.type;
      const badgeClass =
        categoryType === "I"
          ? "bg-success/10 text-success"
          : categoryType === "E"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-foreground";

      const dateStr = tx.date ? new Date(tx.date).toLocaleDateString("it-IT") : "-";
      // Convenzione importi (lib/amount.ts): `amount` è la magnitudine, il segno
      // sta in `type`. La cifra mostrata (ed esportata in CSV) non riporta mai "-".
      const amountStr = formatAmount.format(absoluteAmount(tx.amount));

      return {
        Id: tx.id,
        Date: dateStr,
        Description: tx.description ?? "-",
        Amount: amountStr,
        Wallet: walletName,
        Category: (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
            {categoryName}
          </span>
        ),
      } as Record<string, unknown>;
    });
  }, [transactions, wallets, categories]);

  return (
    <main className="app-page">
      {/* Header */}
      <div className="app-page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
          <NewTransaction onSuccess={() => onRefetch()} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      )}

      {/* Dati troncati: la tabella non e' l'insieme completo del periodo */}
      {!isLoading && truncated && (
        <TruncatedNotice
          shown={transactions.length}
          total={total}
          className="mb-3"
        />
      )}

      {/* Table */}
      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
          <DynamicTable
            data={rows}
            caption={`${captionPrefix} transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}`}
            isLoading={isLoading}
            renderActions={(row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedId(row.Id as number);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Modifica</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedId(row.Id as number);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Elimina</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {selectedId !== null && (
        <>
          <EditDialog
            id={selectedId}
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            onSuccess={() => onRefetch()}
          />
          <DeleteDialog
            isOpen={deleteOpen}
            title="Delete transaction"
            description="Are you sure you want to delete this transaction? This action cannot be undone."
            isPending={deleteTransaction.isPending}
            onClose={() => setDeleteOpen(false)}
            onConfirm={async () => {
              try {
                await deleteTransaction.mutateAsync(String(selectedId));
                setDeleteOpen(false);
                onRefetch();
              } catch {
                // l'errore è già notificato dalla mutation
              }
            }}
          />
        </>
      )}
    </main>
  );
}
