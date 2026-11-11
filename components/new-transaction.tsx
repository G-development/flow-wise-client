"use client";
import React, { ReactNode, useEffect } from "react";
import { CapWarning } from "@/components/movements/cap-warning";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useWallets,
  useActiveCategories,
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
} from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { checkAmountInput } from "@/lib/amountInput";
import { canTransferBetween, findTransferCategory } from "@/lib/transfer";
import { X, TrendingUp, TrendingDown, ArrowLeftRight, Calendar, Wallet as WalletIcon, Tag } from "lucide-react";

type FormData = {
  description: string;
  note: string;
  amount: number | "";
  type: "I" | "E" | "T";
  /** Per un trasferimento ("T") e' il wallet di origine. */
  wallet_id: number | null;
  /** Solo per un trasferimento: il wallet di destinazione. */
  to_wallet_id: number | null;
  category_id: number | null;
  date?: string | null;
  /** Solo per un'entrata: e' un rimborso, con una categoria di spesa (fase 5). */
  is_refund: boolean;
};

const TYPE_OPTIONS = [
  { value: "I", label: "Income", Icon: TrendingUp },
  { value: "E", label: "Expense", Icon: TrendingDown },
  { value: "T", label: "Transfer", Icon: ArrowLeftRight },
] as const;

type NewTransactionProps = {
  onSuccess?: () => void;
  trigger?: ReactNode;
  /** Tipo con cui si apre il pannello (default: spesa). */
  defaultType?: FormData["type"];
  /**
   * Transazione da modificare. Con questa il pannello e' lo stesso modulo di "Add
   * transaction" (stessi campi e regole, trasferimenti inclusi) ma precompilato e
   * salvato con `PUT /transaction/:id`.
   */
  transaction?: Transaction | null;
  /** Apertura controllata dal chiamante (es. la riga della tabella); senza, la gestisce il trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const emptyForm = (type: FormData["type"]): FormData => ({
  description: "",
  note: "",
  amount: "",
  type,
  wallet_id: null,
  to_wallet_id: null,
  category_id: null,
  date: null,
  is_refund: false,
});

/** Valori del modulo per una transazione esistente (date ISO -> yyyy-MM-dd). */
const formFromTransaction = (transaction: Transaction): FormData => ({
  description: transaction.description ?? "",
  note: transaction.note ?? "",
  amount: Number(transaction.amount),
  type: transaction.type,
  wallet_id: transaction.wallet_id == null ? null : Number(transaction.wallet_id),
  to_wallet_id: transaction.to_wallet_id == null ? null : Number(transaction.to_wallet_id),
  category_id: transaction.category_id == null ? null : Number(transaction.category_id),
  date: transaction.date ? String(transaction.date).slice(0, 10) : null,
  is_refund: transaction.is_refund === true,
});

export default function NewTransaction({
  onSuccess,
  trigger,
  defaultType = "E",
  transaction = null,
  open: controlledOpen,
  onOpenChange,
}: NewTransactionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const isEdit = transaction != null;
  const { data: wallets = [] } = useWallets();
  const {
    data: categoryList = EMPTY_LIST_RESPONSE,
    isLoading: categoriesLoading,
  } = useActiveCategories();
  // La risposta e' l'envelope di lista: le righe stanno in `rows`.
  const categories = categoryList.rows;
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [formData, setFormData] = useState<FormData>(emptyForm(defaultType));

  // In modifica il modulo riparte dalla transazione ogni volta che si apre.
  useEffect(() => {
    if (open && transaction) setFormData(formFromTransaction(transaction));
  }, [open, transaction]);

  const defaultWallet = wallets.find((wallet) => wallet.is_default);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // In modifica niente default: un trasferimento da assegnare ha un lato vuoto di proposito.
    if (!open || isEdit) return;

    setFormData((current) => {
      const updatedDate = current.date ?? today;
      const defaultWalletId = defaultWallet ? Number(defaultWallet.id) : null;
      const updatedWalletId = current.wallet_id ?? defaultWalletId;

      if (updatedDate === current.date && updatedWalletId === current.wallet_id) {
        return current;
      }

      return {
        ...current,
        date: updatedDate,
        wallet_id: updatedWalletId,
      };
    });
  }, [open, isEdit, defaultWallet, today]);

  // Un rimborso e' un'entrata con una categoria di spesa: riduce quella spesa (fase 5).
  const isRefundForm = formData.type === "I" && formData.is_refund;
  const filteredCategories = categories.filter((cat) => cat.type === (isRefundForm ? "E" : formData.type));
  const isTransferForm = formData.type === "T";
  // Un trasferimento usa sempre la categoria di sistema "Trasferimento" (server,
  // migrazione 011): non si sceglie, quindi al posto delle categorie c'e' il wallet "To".
  const transferCategory = findTransferCategory(categories);


  const handleSubmit = async () => {
    if (isTransferForm) {
      if (!formData.amount || !formData.wallet_id || !formData.to_wallet_id) {
        toast.error("Please fill amount, from and to");
        return;
      }
      if (formData.wallet_id === formData.to_wallet_id) {
        toast.error("From and to must be different wallets");
        return;
      }
      if (!transferCategory) {
        toast.error("Transfer category not found: the database migration may be missing");
        return;
      }
    } else if (!formData.amount || !formData.wallet_id || !formData.category_id) {
      toast.error("Please fill all required fields");
      return;
    }

    const check = checkAmountInput(Number(formData.amount));

    // Il segno lo porta il selettore Income/Expense: un importo negativo va
    // fermato qui, non normalizzato con `Math.abs` (vedi `lib/amountInput.ts`).
    if (!check.ok) {
      toast.error(check.message);
      return;
    }

    const payload = isTransferForm
      ? {
          description: formData.description || "Trasferimento",
          note: formData.note,
          amount: check.amount,
          type: "T" as const,
          wallet_id: formData.wallet_id,
          to_wallet_id: formData.to_wallet_id,
          category_id: Number(transferCategory!.id),
          date: formData.date || undefined,
        }
      : {
          description: formData.description,
          note: formData.note,
          amount: check.amount,
          type: formData.type,
          wallet_id: formData.wallet_id,
          category_id: formData.category_id!,
          date: formData.date || undefined,
          // Mandato solo se serve (rimborso, o un rimborso che torna entrata): la colonna c'e'
          // solo dalla migrazione 014 del server.
          ...(isRefundForm || transaction?.is_refund ? { is_refund: isRefundForm } : {}),
        };

    const done = () => {
      onSuccess?.();
      setFormData(emptyForm(defaultType));
      setOpen(false);
    };

    if (isEdit) {
      // Il PUT vuole la transazione intera; una spesa/entrata manda `to_wallet_id: null`.
      updateTransaction.mutate(
        { id: String(transaction.id), data: { to_wallet_id: null, ...payload } },
        { onSuccess: done }
      );
    } else {
      createTransaction.mutate(payload, { onSuccess: done });
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {(trigger || controlledOpen === undefined) && (
        <DrawerTrigger asChild>
          {trigger ?? <Button>Add Transaction</Button>}
        </DrawerTrigger>
      )}
      <DrawerContent className="h-[85vh] px-3 sm:px-6 py-4 sm:py-6 lg:px-[22%] max-w-full overflow-x-hidden">
        <DrawerHeader className="px-0 relative">
          <DrawerTitle className="text-lg sm:text-xl">{isEdit ? "Edit transaction" : "Add transaction"}</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Capture income, expense or a transfer between wallets.
          </DrawerDescription>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-2 pr-1 sm:pr-2 overscroll-contain">
          <div className="grid gap-3">
            <Label className="text-sm font-medium">Details</Label>
            {/* Descrizione e tipo su due righe: con tre tipi la mezza riga non bastava
                e le etichette dei pulsanti venivano tagliate. */}
            <div className="grid gap-3">
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {/* Griglia e `min-w-0` sui pulsanti: in flex i tre pulsanti non si restringono
                  e "Transfer" usciva dal riquadro nelle colonne strette. */}
              <div className="grid grid-cols-3 gap-2 rounded-md border p-2 text-sm">
                {TYPE_OPTIONS.map(({ value, label, Icon }) => {
                  const isActive = formData.type === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      className="min-w-0 justify-center px-2"
                      onClick={() =>
                        // Cambiando tipo la categoria scelta non vale piu': e' filtrata per tipo.
                        setFormData({ ...formData, type: value, category_id: null, is_refund: false })
                      }
                    >
                      {/* Sotto i 640px l'icona toglie lo spazio alla parola: resta solo il testo. */}
                      <Icon className="mr-1.5 hidden h-4 w-4 shrink-0 sm:inline-block" />
                      <span className="truncate">{label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value ? parseFloat(e.target.value) : "",
                  })
                }
              />
            </div>

            <div className="grid gap-2 min-w-0">
              <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date ?? ""}
                className="bg-background max-w-full"
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <WalletIcon className="h-4 w-4" /> {isTransferForm ? "From" : "Wallet"}
              </Label>
              <Select
                value={formData.wallet_id?.toString() ?? undefined}
                onValueChange={(value) => {
                  // Cambiando l'origine, una destinazione non piu' ammessa (es. il salvadanaio di un
                  // altro conto) si azzera invece di arrivare al server e farsi rifiutare.
                  const from = wallets.find((w) => Number(w.id) === parseInt(value));
                  const to = wallets.find((w) => Number(w.id) === formData.to_wallet_id);
                  const keepTo = !from || !to || canTransferBetween(from, to);
                  setFormData({ ...formData, wallet_id: parseInt(value), to_wallet_id: keepTo ? formData.to_wallet_id : null });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTransferForm ? (
              <div className="grid gap-2 min-w-0">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <WalletIcon className="h-4 w-4" /> To
                </Label>
                <Select
                  value={formData.to_wallet_id?.toString() ?? undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, to_wallet_id: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter((w) => {
                        const from = wallets.find((x) => Number(x.id) === formData.wallet_id);
                        return from ? canTransferBetween(from, w) : true;
                      })
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!transaction && (
                  <CapWarning wallets={wallets} toWalletId={formData.to_wallet_id} amountEuro={Number(String(formData.amount).replace(",", "."))} />
                )}
              </div>
            ) : (
              <div className="grid gap-2 min-w-0">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Category
                </Label>
                <Select
                  value={formData.category_id?.toString() ?? undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: parseInt(value) })
                  }
                  disabled={categoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading && (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    )}
                    {!categoriesLoading && filteredCategories.length === 0 && (
                      <SelectItem value="empty" disabled>
                        No categories available
                      </SelectItem>
                    )}
                    {!categoriesLoading && filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.type === "I" && (
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={formData.is_refund}
                      onChange={(event) => setFormData({ ...formData, is_refund: event.target.checked, category_id: null })}
                    />
                    <span>Refund: money paid back for an expense (e.g. a friend&apos;s share of a dinner). Pick the expense category it reduces.</span>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="mt-6 grid grid-cols-2 gap-3 px-0">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
          <Button onClick={handleSubmit} className="w-full">
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
