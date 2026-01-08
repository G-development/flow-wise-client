"use client";

import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { useExpenses, useWallets, useCategories } from "@/lib/hooks/useQueries";
import DatePickerWithRange from "@/components/date-picker";
import { DynamicTable } from "@/components/dynamic-table";
import Navbar from "@/components/navbar";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import EditDialog from "@/components/edit-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { Pencil, Trash } from "lucide-react";

export default function Expenses() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

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
        ? "bg-emerald-100 text-emerald-800"
        : categoryType === "expense"
          ? "bg-rose-100 text-rose-800"
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-1">
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
          <div className="overflow-x-auto rounded-lg border">
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
      </div>
    </>
  );
}
