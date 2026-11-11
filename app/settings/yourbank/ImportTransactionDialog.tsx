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
  const { data: allWallets = [], isLoading: loadingWallets } = useWallets();
  // Una banca importa sempre in un conto: i movimenti dei salvadanai arrivano come trasferimenti
  // da assegnare (U5, deciso da Gio il 10/11). Il server rifiuta comunque un salvadanaio.
  const wallets = allWallets.filter((wallet) => wallet.kind !== "pot");
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
        // "Trasferimento" (tipo T) va bene per entrambi i segni: il server importa il
        // movimento come trasferimento da assegnare (utils/bankService.js).
        return (
          (!selectedCategory && !isCreatedOther) ||
          (selectedCategory &&
            selectedCategory.type !== "T" &&
            selectedCategory.type !== getBankTransactionType(transaction.amount))
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
      toast.success("\"Altro\" categories created. Check the suggestions before importing.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the \"Altro\" categories");
    } finally {
      setIsCreatingOther(false);
    }
  };

  const handleImport = async () => {
    if (!effectiveWalletId) {
      toast.error("Pick a target wallet");
      return;
    }
    if (loadingCategories) {
      toast.error("Wait for the categories to load");
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
      toast.error("Pick a valid category for every movement before importing");
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
    const toastId = toast.loading("Importing movements...");
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
          throw new Error(errorData.error || "Error while importing");
        }
        const data = await response.json().catch(() => null);
        importedTotal +=
          typeof data?.importedCount === "number" ? data.importedCount : transactionIds.length;
        groupCount += 1;
      }

      await invalidateImportedData(queryClient);
      toast.success(
        `${importedTotal} ${importedTotal === 1 ? "movement" : "movements"} imported (${groupCount} ${groupCount === 1 ? "group" : "groups"}).`,
        { id: toastId }
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error while importing";
      if (importedTotal > 0) {
        await invalidateImportedData(queryClient);
        toast.error(`${message}. ${importedTotal} movements were imported anyway; refreshing the list.`, {
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
    .map((type) => (type === "I" ? "income" : "expenses"))
    .join(" and ");
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
              Import into Flow Wise
            </DialogTitle>
            <DialogDescription>
              {transactions.length === 1
                ? "Check and confirm the suggested category for this movement."
                : `Review the suggested categories for the ${stats.totalCount} selected movements.`}
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
                  <span>Total expenses</span>
                  <span>−{stats.totalExpense.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                </div>
              )}
              {stats.totalIncome > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Total income</span>
                  <span>+{stats.totalIncome.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-wallet" className="text-sm font-medium">
                Target wallet
              </Label>
              <Select
                value={effectiveWalletId}
                onValueChange={setSelectedWalletId}
                disabled={loadingWallets || wallets.length === 0}
              >
                <SelectTrigger id="target-wallet" className="w-full">
                  <SelectValue placeholder="Pick a wallet" />
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
                  No wallet found. Create one in Movements before importing.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Category per movement</Label>
                {uncertainCount > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {uncertainCount} da controllare
                  </span>
                )}
              </div>
              {loadingCategories ? (
                <p className="text-xs text-muted-foreground">Loading categories…</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-destructive">
                  No active category. Create one in Categories before importing.
                </p>
              ) : (
                <ScrollArea className="h-[min(40vh,320px)] rounded-md border">
                  <div className="space-y-2 p-2">
                    {transactions.map((transaction) => {
                      const type = getBankTransactionType(transaction.amount);
                      const suggestion = suggestions[transaction.id];
                      const selectedCategoryId = categoryIdByTxnId[transaction.id] || "";
                      const categoryOptions = [
                        ...categories.filter((category) => category.type === type || category.type === "T"),
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
                          className="grid grid-cols-1 items-center gap-2 rounded-md bg-muted/50 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(150px,200px)] sm:gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-start gap-1.5">
                              {suggestion?.uncertain && (
                                <span title="Uncertain suggestion: check the category" className="mt-0.5 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle aria-label="Uncertain suggestion" className="h-4 w-4" />
                                </span>
                              )}
                              <p className="line-clamp-2 break-words text-sm font-medium sm:truncate" title={transaction.description}>
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
                              aria-label={`Category for ${transaction.description || "movement"}`}
                              className={needsChoice ? "border-amber-500" : ""}
                            >
                              <SelectValue placeholder="Pick a category" />
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
                  You chose not to create “Altro”. Pick a category for {unresolvedTransactions.length} {unresolvedTransactions.length === 1 ? "movement" : "movements"} without a suggestion.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
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
              {isSubmitting ? "Importing..." : "Confirm import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCreateOtherOpen} onOpenChange={(nextOpen) => !isCreatingOther && setIsCreateOtherOpen(nextOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create the “Altro” category?</AlertDialogTitle>
            <AlertDialogDescription>
              You have no active “Altro” category for {createTypesLabel}. Create it and use it as the suggestion for movements without a sure match? You can still review the categories before importing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
            disabled={isCreatingOther}
            onClick={() => setDeclinedOtherTypes((previous) => Array.from(new Set([...previous, ...createOtherTypes])))}
          >
            No, I&apos;ll pick
          </AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void createMissingOtherCategories(); }} disabled={isCreatingOther}>
              {isCreatingOther ? "Creating…" : "Create category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
