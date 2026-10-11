"use client";

import { useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { queryKeys, useActiveCategories, useWallets } from "@/lib/hooks/useQueries";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Wallet as WalletIcon,
} from "lucide-react";

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

type TxnType = "income" | "expense";

function normalizeForMatch(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const normalized = normalizeForMatch(text);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

function getTxnTypeFromAmount(amount: number | string): TxnType {
  const n = Number(amount);
  return Number.isFinite(n) && n >= 0 ? "income" : "expense";
}

function scoreCategoryForTxn(
  txnTextNorm: string,
  categoryNameNorm: string,
  categoryTokens: string[]
): number {
  if (!txnTextNorm || !categoryNameNorm) return 0;

  // Bonus forte se la categoria appare come substring della causale normalizzata
  let score = 0;
  if (txnTextNorm.includes(categoryNameNorm) && categoryNameNorm.length >= 3) {
    score += 100;
  }

  // Bonus token-based
  for (const token of categoryTokens) {
    if (!token) continue;
    if (txnTextNorm === token) score += 10;
    else if (txnTextNorm.includes(token)) score += token.length >= 4 ? 6 : 2;
  }

  return score;
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
  const {
    data: categories = [],
    isLoading: loadingCategories,
  } = useActiveCategories();

  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Solo per import massivo: se ON, suggerisce una categoria per transazione e
  // raggruppa gli import per categoryId.
  const [autoSuggest, setAutoSuggest] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBulk = transactions.length > 1;

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
    const expectedType = stats.singleIsIncome ? "I" : "E";
    const filtered = categories.filter((c) => c.type === expectedType);
    return filtered.length > 0 ? filtered : categories;
  }, [categories, stats.isSingle, stats.singleIsIncome]);

  const suggestedCategoryIdByTxnId = useMemo(() => {
    if (!isBulk) return {} as Record<string, string>;
    if (!categories || categories.length === 0) return {} as Record<string, string>;

    const incomeCategories = categories.filter((c) => c.type === "I");
    const expenseCategories = categories.filter((c) => c.type === "E");

    const result: Record<string, string> = {};

    for (const txn of transactions) {
      const txnType = getTxnTypeFromAmount(txn.amount);
      const candidates = txnType === "income" ? incomeCategories : expenseCategories;

      if (!candidates || candidates.length === 0) {
        result[txn.id] = "";
        continue;
      }

      const txnTextNorm = normalizeForMatch(
        `${txn.description || ""} ${txn.counterparty || ""}`
      );

      let best = candidates[0];
      let bestScore = -Infinity;

      for (const cat of candidates) {
        const catNameNorm = normalizeForMatch(cat.name || "");
        const catTokens = tokenize(cat.name || "");
        const score = scoreCategoryForTxn(txnTextNorm, catNameNorm, catTokens);

        if (score > bestScore) {
          best = cat;
          bestScore = score;
        }
      }

      // Se nessuna categoria ottiene un punteggio, resta la prima del tipo
      // corretto: l'import non deve bloccarsi per un suggerimento imperfetto.
      result[txn.id] = String(best?.id ?? "");
    }

    return result;
  }, [categories, isBulk, transactions]);

  const suggestedCategorySummary = useMemo(() => {
    if (!isBulk || !autoSuggest) return [] as Array<{ categoryId: string; count: number }>;

    const counts = new Map<string, number>();
    for (const txn of transactions) {
      const catId = suggestedCategoryIdByTxnId[txn.id];
      if (!catId) continue;
      counts.set(catId, (counts.get(catId) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => b.count - a.count);
  }, [autoSuggest, isBulk, suggestedCategoryIdByTxnId, transactions]);

  const getCategoryNameById = (categoryId: string) => {
    const found = categories.find((c) => String(c.id) === String(categoryId));
    return found ? String(found.name || categoryId) : categoryId;
  };

  const handleImport = async () => {
    if (!effectiveWalletId) {
      toast.error("Seleziona un wallet di destinazione");
      return;
    }

    const requireManualCategory = stats.isSingle || (isBulk && !autoSuggest);
    if (requireManualCategory && !selectedCategoryId) {
      toast.error("Seleziona una categoria per i movimenti");
      return;
    }

    // Se auto-suggest è attivo, serve che le categorie siano disponibili per calcolare i suggerimenti
    if (isBulk && autoSuggest && (!categories || categories.length === 0)) {
      toast.error("Nessuna categoria disponibile per l’auto-suggerimento");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Importazione dei movimenti in corso...");

    try {
      // Import singolo o modalità manuale (una categoria per tutti)
      if (stats.isSingle || !autoSuggest) {
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
      } else {
        // Import massivo con auto-suggest: raggruppa per categoryId suggerito
        const groupedByCategory = new Map<string, string[]>();

        for (const txn of transactions) {
          const suggestedCategoryId = suggestedCategoryIdByTxnId[txn.id];
          if (!suggestedCategoryId) {
            throw new Error(
              "Impossibile suggerire una categoria per almeno una transazione"
            );
          }
          const ids = groupedByCategory.get(suggestedCategoryId) || [];
          ids.push(txn.id);
          groupedByCategory.set(suggestedCategoryId, ids);
        }

        let importedTotal = 0;
        let groupCount = 0;

        for (const [categoryId, transactionIds] of groupedByCategory.entries()) {
          groupCount += 1;
          const response = await apiFetch("/bank/import", {
            method: "POST",
            body: JSON.stringify({
              transactionIds,
              walletId: Number(effectiveWalletId),
              categoryId: Number(categoryId),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Errore durante l'importazione");
          }

          const data = await response.json().catch(() => null);
          importedTotal +=
            typeof data?.importedCount === "number" ? data.importedCount : transactionIds.length;
        }

        // Se auto-suggest ha funzionato, la UI si aspetta sempre la stessa invalidazione
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
        ]);

        toast.success(
          `${importedTotal} movimenti importati con successo (${groupCount} gruppi).`,
          { id: toastId }
        );

        onOpenChange(false);
        onSuccess();
        return;
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
        error instanceof Error
          ? error.message
          : "Errore durante l'importazione";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requireManualCategory = stats.isSingle || (isBulk && !autoSuggest);

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
            {stats.isSingle ? (
              <>
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
                            {cat.type === "I" ? "Entrata" : "Spesa"}
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-medium" htmlFor="auto-suggest">
                    Auto suggerimento
                  </Label>
                  <Switch
                    id="auto-suggest"
                    checked={autoSuggest}
                    onCheckedChange={(checked) => setAutoSuggest(!!checked)}
                    disabled={loadingCategories || categories.length === 0}
                  />
                </div>

                {autoSuggest ? (
                  <div className="text-xs text-muted-foreground">
                    {suggestedCategorySummary.length > 0 ? (
                      <>
                        Suggerite: {" "}
                        {suggestedCategorySummary
                          .slice(0, 3)
                          .map((g) => `${getCategoryNameById(g.categoryId)} (${g.count})`)
                          .join(", ")}
                        {suggestedCategorySummary.length > 3 ? "…" : ""}
                      </>
                    ) : (
                      <span>Calcolo suggerimenti…</span>
                    )}
                  </div>
                ) : (
                  <>
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
                                {cat.type === "I" ? "Entrata" : "Spesa"}
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
                  </>
                )}
              </>
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
              transactions.length === 0 ||
              // Se manuale serve selectedCategoryId
              (requireManualCategory ? !selectedCategoryId : false) ||
              // Se auto-suggest serve almeno una categoria attiva
              (isBulk && autoSuggest ? loadingCategories || categories.length === 0 : false)
            }
          >
            {isSubmitting ? "Importazione in corso..." : "Conferma Importazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
