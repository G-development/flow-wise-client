"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import {
  queryKeys,
  useActiveCategories,
  useCreateCategory,
  useWallets,
  type Category,
} from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import {
  getBankTransactionType,
  getMissingOtherTypes,
  suggestBankTransactionCategory,
  type BankTransactionType,
  type CategorySuggestion,
} from "@/lib/bankCategorySuggestion";
import { toast } from "sonner";
import {
  AlertTriangle,
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

interface ImportTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: BankTransactionItem[];
  onSuccess: () => void;
}

function invalidateImportedData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
  ]);
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
    data: categoryList = EMPTY_LIST_RESPONSE,
    isLoading: loadingCategories,
  } = useActiveCategories();
  const categories = categoryList.rows;
  const createCategory = useCreateCategory();

  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [categoryIdByTxnId, setCategoryIdByTxnId] = useState<Record<string, string>>({});
  const [createOtherTypes, setCreateOtherTypes] = useState<BankTransactionType[]>([]);
  const [createdOtherCategoryIdByType, setCreatedOtherCategoryIdByType] = useState<Record<string, string>>({});
  const [createdOtherCategories, setCreatedOtherCategories] = useState<Category[]>([]);
  const [isCreateOtherOpen, setIsCreateOtherOpen] = useState(false);
  const [declinedOtherTypes, setDeclinedOtherTypes] = useState<BankTransactionType[]>([]);
  const [isCreatingOther, setIsCreatingOther] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestions = useMemo(() => {
    const result: Record<string, CategorySuggestion> = {};
    for (const transaction of transactions) {
      result[transaction.id] = suggestBankTransactionCategory(transaction, categories);
    }
    return result;
  }, [categories, transactions]);

  useEffect(() => {
    setCategoryIdByTxnId((previous) => {
      const next: Record<string, string> = {};
      for (const [transactionId, suggestion] of Object.entries(suggestions)) {
        next[transactionId] = previous[transactionId] || suggestion.categoryId;
      }
      return next;
    });
  }, [suggestions]);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      if (amount >= 0) totalIncome += amount;
      else totalExpense += Math.abs(amount);
    }
    return { totalCount: transactions.length, totalIncome, totalExpense };
  }, [transactions]);

  const effectiveWalletId = useMemo(() => {
    if (selectedWalletId) return selectedWalletId;
    const defaultWallet = wallets.find((wallet) => wallet.is_default);
    if (defaultWallet) return String(defaultWallet.id);
    return wallets.length > 0 ? String(wallets[0].id) : "";
  }, [selectedWalletId, wallets]);

  const uncertainCount = useMemo(
    () => Object.values(suggestions).filter((suggestion) => suggestion.uncertain).length,
    [suggestions]
  );

  const unresolvedTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const selectedCategoryId = categoryIdByTxnId[transaction.id];
        const selectedCategory = categories.find(
          (category) => String(category.id) === selectedCategoryId
        );
        const isCreatedOther =
          createdOtherCategoryIdByType[getBankTransactionType(transaction.amount)] === selectedCategoryId;
        return (
          (!selectedCategory && !isCreatedOther) ||
          (selectedCategory && selectedCategory.type !== getBankTransactionType(transaction.amount))
        );
      }),
    [categories, categoryIdByTxnId, createdOtherCategoryIdByType, transactions]
  );

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    setCategoryIdByTxnId((previous) => ({ ...previous, [transactionId]: categoryId }));
  };

  const createMissingOtherCategories = async () => {
    setIsCreatingOther(true);
    try {
      const created: Category[] = [];
      for (const type of createOtherTypes) {
        const result = (await createCategory.mutateAsync({ name: "Altro", type })) as Category;
        created.push(result);
      }

      const createdIds: Record<string, string> = {};
      for (const category of created) {
        createdIds[category.type] = String(category.id);
      }
      setCreatedOtherCategoryIdByType((previous) => ({ ...previous, ...createdIds }));
      setCreatedOtherCategories((previous) => [...previous, ...created]);
      setCategoryIdByTxnId((previous) => {
        const next = { ...previous };
        for (const transaction of transactions) {
          if (!suggestions[transaction.id]?.uncertain || next[transaction.id]) continue;
          const type = getBankTransactionType(transaction.amount);
          const categoryId = createdIds[type];
          if (categoryId) next[transaction.id] = categoryId;
        }
        return next;
      });
      setIsCreateOtherOpen(false);
      setCreateOtherTypes([]);
      setDeclinedOtherTypes([]);
      toast.success("Categorie Altro create. Controlla i suggerimenti prima di importare.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossibile creare le categorie Altro");
    } finally {
      setIsCreatingOther(false);
    }
  };

  const handleImport = async () => {
    if (!effectiveWalletId) {
      toast.error("Seleziona un wallet di destinazione");
      return;
    }
    if (loadingCategories) {
      toast.error("Attendi il caricamento delle categorie");
      return;
    }

    const transactionsNeedingFallback = transactions.filter(
      (transaction) => !categoryIdByTxnId[transaction.id]
    );
    const missingTypes = getMissingOtherTypes(
      transactionsNeedingFallback,
      suggestions,
      categories
    );
    const typesToAsk = missingTypes.filter((type) => !declinedOtherTypes.includes(type));
    if (typesToAsk.length > 0) {
      setCreateOtherTypes(typesToAsk);
      setIsCreateOtherOpen(true);
      return;
    }
    if (
      unresolvedTransactions.some((transaction) =>
        declinedOtherTypes.includes(getBankTransactionType(transaction.amount))
      )
    ) {
      toast.error("Scegli una categoria valida per ogni movimento prima di importare");
      return;
    }

    const groups = new Map<string, string[]>();
    for (const transaction of transactions) {
      const categoryId = categoryIdByTxnId[transaction.id];
      const ids = groups.get(categoryId) || [];
      ids.push(transaction.id);
      groups.set(categoryId, ids);
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Importazione dei movimenti in corso...");
    let importedTotal = 0;
    let groupCount = 0;
    try {
      for (const [categoryId, transactionIds] of groups) {
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
        groupCount += 1;
      }

      await invalidateImportedData(queryClient);
      toast.success(
        `${importedTotal} ${importedTotal === 1 ? "movimento importato" : "movimenti importati"} con successo (${groupCount} gruppi).`,
        { id: toastId }
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante l'importazione";
      if (importedTotal > 0) {
        await invalidateImportedData(queryClient);
        toast.error(`${message}. Importati parzialmente ${importedTotal} movimenti; aggiorno l'elenco.`, {
          id: toastId,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(message, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTypesLabel = createOtherTypes
    .map((type) => (type === "I" ? "entrate" : "spese"))
    .join(" e ");
  const unresolvedTypes = Array.from(
    new Set(unresolvedTransactions.map((transaction) => getBankTransactionType(transaction.amount)))
  );
  const mustChooseManually = unresolvedTypes.some((type) => declinedOtherTypes.includes(type));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Importa in Flow Wise
            </DialogTitle>
            <DialogDescription>
              {transactions.length === 1
                ? "Controlla e conferma la categoria suggerita per questo movimento."
                : `Rivedi le categorie suggerite per i ${stats.totalCount} movimenti selezionati.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between font-medium text-foreground text-sm">
                <span>Movimenti selezionati</span>
                <span>{stats.totalCount}</span>
              </div>
              {stats.totalExpense > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Totale spese</span>
                  <span>−{stats.totalExpense.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                </div>
              )}
              {stats.totalIncome > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Totale entrate</span>
                  <span>+{stats.totalIncome.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                </div>
              )}
            </div>

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
                  Nessun wallet trovato. Creane uno nella sezione Wallet prima di importare.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Categoria per movimento</Label>
                {uncertainCount > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {uncertainCount} da controllare
                  </span>
                )}
              </div>
              {loadingCategories ? (
                <p className="text-xs text-muted-foreground">Caricamento categorie…</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-destructive">
                  Nessuna categoria attiva. Creane una nella sezione Categorie prima di importare.
                </p>
              ) : (
                <ScrollArea className="h-[min(40vh,320px)] rounded-md border">
                  <div className="space-y-2 p-2">
                    {transactions.map((transaction) => {
                      const type = getBankTransactionType(transaction.amount);
                      const suggestion = suggestions[transaction.id];
                      const selectedCategoryId = categoryIdByTxnId[transaction.id] || "";
                      const categoryOptions = [
                        ...categories.filter((category) => category.type === type),
                        ...createdOtherCategories.filter(
                          (category) =>
                            category.type === type &&
                            !categories.some((existing) => String(existing.id) === String(category.id))
                        ),
                      ];
                      const needsChoice = !selectedCategoryId;
                      return (
                        <div
                          key={transaction.id}
                          className="grid grid-cols-[minmax(0,1fr)_minmax(150px,200px)] items-center gap-3 rounded-md bg-muted/50 p-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-start gap-1.5">
                              {suggestion?.uncertain && (
                                <span title="Suggerimento incerto: controlla la categoria" className="mt-0.5 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle aria-label="Suggerimento incerto" className="h-4 w-4" />
                                </span>
                              )}
                              <p className="truncate text-sm font-medium" title={transaction.description}>
                                {transaction.description || "Movimento senza descrizione"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {Number(transaction.amount) >= 0 ? (
                                <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3 text-rose-500" />
                              )}
                              <span>
                                {Number(transaction.amount).toLocaleString("it-IT", {
                                  style: "currency",
                                  currency: transaction.currency || "EUR",
                                })}
                              </span>
                              {transaction.counterparty && <span className="truncate">· {transaction.counterparty}</span>}
                            </div>
                          </div>
                          <Select
                            value={selectedCategoryId}
                            onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                            disabled={categoryOptions.length === 0 || isSubmitting}
                          >
                            <SelectTrigger
                              aria-label={`Categoria per ${transaction.description || "movimento"}`}
                              className={needsChoice ? "border-amber-500" : ""}
                            >
                              <SelectValue placeholder="Scegli categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
              {mustChooseManually && unresolvedTransactions.length > 0 && !loadingCategories && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Hai scelto di non creare “Altro”. Seleziona una categoria per {unresolvedTransactions.length} {unresolvedTransactions.length === 1 ? "movimento" : "movimenti"} senza proposta.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={
                isSubmitting ||
                loadingCategories ||
                !effectiveWalletId ||
                transactions.length === 0
              }
            >
              {isSubmitting ? "Importazione in corso..." : "Conferma importazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCreateOtherOpen} onOpenChange={(nextOpen) => !isCreatingOther && setIsCreateOtherOpen(nextOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Crea la categoria “Altro”?</AlertDialogTitle>
            <AlertDialogDescription>
              Non hai una categoria attiva “Altro” per {createTypesLabel}. Vuoi crearla e usarla come proposta per i movimenti senza una corrispondenza sicura? Potrai rivedere e modificare le categorie prima di importare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
            disabled={isCreatingOther}
            onClick={() => setDeclinedOtherTypes((previous) => Array.from(new Set([...previous, ...createOtherTypes])))}
          >
            No, scelgo io
          </AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void createMissingOtherCategories(); }} disabled={isCreatingOther}>
              {isCreatingOther ? "Creazione…" : "Crea categoria"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
