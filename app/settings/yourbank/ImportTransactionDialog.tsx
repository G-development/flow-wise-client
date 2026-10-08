"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { queryKeys, useWallets, useActiveCategories } from "@/lib/hooks/useQueries";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Wallet as WalletIcon } from "lucide-react";

export interface BankTransactionItem {
  id: string;
  external_id: string;
  bank_id: string;
  amount: number | string;
  currency: string;
  description: string;
  date: string;
  counterparty: string | null;
  status?: string;
}

interface ImportTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: BankTransactionItem[];
  onSuccess: () => void;
}

export default function ImportTransactionDialog({
  open,
  onOpenChange,
  transactions,
  onSuccess,
}: ImportTransactionDialogProps) {
  const queryClient = useQueryClient();
  const { data: wallets = [], isLoading: loadingWallets } = useWallets();
  const { data: categories = [], isLoading: loadingCategories } = useActiveCategories();

  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcola statistiche dei movimenti selezionati
  const stats = useMemo(() => {
    const totalCount = transactions.length;
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((txn) => {
      const amt = Number(txn.amount);
      if (amt >= 0) {
        totalIncome += amt;
      } else {
        totalExpense += Math.abs(amt);
      }
    });

    const isSingle = totalCount === 1;
    const singleTxn = isSingle ? transactions[0] : null;
    const singleIsIncome = singleTxn ? Number(singleTxn.amount) >= 0 : false;

    return {
      totalCount,
      totalIncome,
      totalExpense,
      isSingle,
      singleTxn,
      singleIsIncome,
    };
  }, [transactions]);

  // Seleziona un wallet predefinito se non ancora scelto
  const effectiveWalletId = useMemo(() => {
    if (selectedWalletId) return selectedWalletId;
    const defaultWallet = wallets.find((w) => w.is_default);
    if (defaultWallet) return String(defaultWallet.id);
    if (wallets.length > 0) return String(wallets[0].id);
    return "";
  }, [selectedWalletId, wallets]);

  // Categorie filtrate se è un singolo movimento (Entrata o Spesa)
  const filteredCategories = useMemo(() => {
    if (!stats.isSingle) return categories;
    const isIncome = stats.singleIsIncome;
    const filtered = categories.filter((c) => {
      const typeStr = String(c.type || "").toLowerCase();
      const isCatIncome = typeStr === "i" || typeStr === "income";
      const isCatExpense = typeStr === "e" || typeStr === "expense";
      return isIncome ? isCatIncome : isCatExpense;
    });
    return filtered.length > 0 ? filtered : categories;
  }, [categories, stats.isSingle, stats.singleIsIncome]);

  const handleImport = async () => {
    if (!effectiveWalletId) {
      toast.error("Seleziona un wallet di destinazione");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Seleziona una categoria per i movimenti");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Importazione dei movimenti in corso...");

    try {
      const response = await apiFetch("/bank/import", {
        method: "POST",
        body: JSON.stringify({
          transactionIds: transactions.map((t) => t.id),
          walletId: Number(effectiveWalletId),
          categoryId: Number(selectedCategoryId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Errore durante l'importazione");
      }

      // Invalida le query di Flow Wise per aggiornare la dashboard e i wallet
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      ]);

      toast.success(
        stats.isSingle
          ? "Movimento importato con successo in Flow Wise!"
          : `${transactions.length} movimenti importati con successo!`,
        { id: toastId }
      );

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore durante l'importazione";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Importa in Flow Wise
          </DialogTitle>
          <DialogDescription>
            {stats.isSingle
              ? "Converti questo movimento bancario in una transazione contabile della tua dashboard."
              : `Importa ${stats.totalCount} movimenti bancari selezionati nel tuo bilancio.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dettagli Anteprima Transazione */}
          {stats.isSingle && stats.singleTxn ? (
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {stats.singleTxn.description || "Movimento senza descrizione"}
                  </p>
                  {stats.singleTxn.counterparty && (
                    <p className="text-xs text-muted-foreground">
                      Controparte: {stats.singleTxn.counterparty}
                    </p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-1 font-semibold ${
                    stats.singleIsIncome ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {stats.singleIsIncome ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  {Number(stats.singleTxn.amount).toLocaleString("it-IT", {
                    style: "currency",
                    currency: stats.singleTxn.currency || "EUR",
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Data: {new Date(stats.singleTxn.date).toLocaleDateString("it-IT")} • Banca:{" "}
                {stats.singleTxn.bank_id.toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between font-medium text-foreground text-sm">
                <span>Movimenti selezionati</span>
                <span>{stats.totalCount}</span>
              </div>
              {stats.totalExpense > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Totale Spese</span>
                  <span>
                    -
                    {stats.totalExpense.toLocaleString("it-IT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              )}
              {stats.totalIncome > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Totale Entrate</span>
                  <span>
                    +
                    {stats.totalIncome.toLocaleString("it-IT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Selezione Wallet */}
          <div className="space-y-2">
            <Label htmlFor="target-wallet" className="text-sm font-medium">
              Wallet di destinazione
            </Label>
            <Select
              value={effectiveWalletId}
              onValueChange={setSelectedWalletId}
              disabled={loadingWallets || wallets.length === 0}
            >
              <SelectTrigger id="target-wallet" className="w-full">
                <SelectValue placeholder="Seleziona un wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={String(wallet.id)}>
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{wallet.name}</span>
                      {wallet.is_default && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Predefinito
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {wallets.length === 0 && !loadingWallets && (
              <p className="text-xs text-destructive">
                Nessun wallet trovato. Creane uno nella sezione Wallets prima di importare.
              </p>
            )}
          </div>

          {/* Selezione Categoria */}
          <div className="space-y-2">
            <Label htmlFor="target-category" className="text-sm font-medium">
              Categoria
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={loadingCategories || filteredCategories.length === 0}
            >
              <SelectTrigger id="target-category" className="w-full">
                <SelectValue placeholder="Seleziona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{cat.name}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {String(cat.type || "").toLowerCase().startsWith("i")
                          ? "Entrata"
                          : "Spesa"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredCategories.length === 0 && !loadingCategories && (
              <p className="text-xs text-destructive">
                Nessuna categoria disponibile. Creane una nella sezione Categorie.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={
              isSubmitting ||
              !effectiveWalletId ||
              !selectedCategoryId ||
              transactions.length === 0
            }
          >
            {isSubmitting ? "Importazione in corso..." : "Conferma Importazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
