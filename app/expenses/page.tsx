"use client";

import { useMemo, useState } from "react";
import { useExpenses, useWallets, useCategories } from "@/lib/hooks/useQueries";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";
import { useDateRange } from "@/lib/providers/DateRangeProvider";

export default function Expenses() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { dateRange, setDateRange } = useDateRange();

  const { data: transactions = [], isLoading, refetch } = useExpenses(
    dateRange?.from?.toISOString().split("T")[0],
    dateRange?.to?.toISOString().split("T")[0]
  );

  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();

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
      const badgeClass = categoryType === "income"
        ? "bg-success/10 text-success"
        : categoryType === "expense"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-foreground";

      const dateStr = tx.date ? new Date(tx.date).toLocaleDateString("it-IT") : "-";
      const amountStr = formatAmount.format(Number(tx.amount ?? 0));

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
    <>
      <Navbar />
      <main className="app-page">
        {/* Header */}
        <div className="app-page-header">
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-description">
              Record and analyze your expenses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <DatePickerWithRange date={dateRange} dateChange={setDateRange} />
            <NewTransaction onSuccess={() => refetch()} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
          <DynamicTable
            data={rows}
            caption={`Expense transactions shown from ${dateRange?.from?.toDateString()} to ${dateRange?.to?.toDateString()}`}
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
              onSuccess={() => refetch()}
            />
            <DeleteDialog
              id={selectedId}
              isOpen={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onSuccess={() => refetch()}
            />
          </>
        )}
      </main>
    </>
  );
}
