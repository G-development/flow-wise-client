"use client";
import React, { useEffect } from "react";
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
import { useWallets, useActiveCategories, useCreateTransaction } from "@/lib/hooks/useQueries";
import { X, TrendingUp, TrendingDown, Calendar, Wallet as WalletIcon, Tag } from "lucide-react";

type FormData = {
  description: string;
  note: string;
  amount: number | "";
  type: "I" | "E";
  wallet_id: number | null;
  category_id: number | null;
  date?: string | null;
};

type NewTransactionProps = {
  onSuccess?: () => void;
};

export default function NewTransaction({ onSuccess }: NewTransactionProps) {
  const [open, setOpen] = useState(false);
  const { data: wallets = [] } = useWallets();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useActiveCategories();
  const createTransaction = useCreateTransaction();
  
  const [formData, setFormData] = useState<FormData>({
    description: "",
    note: "",
    amount: "",
    type: "E",
    wallet_id: null,
    category_id: null,
    date: null,
  });

  const filteredCategories = categories.filter((cat) => {
    const typeLower = typeof cat.type === "string" ? cat.type.toLowerCase() : "";
    const targetType = formData.type === "I" ? "income" : "expense";
    return typeLower === targetType || typeLower === formData.type.toLowerCase();
  });

  useEffect(() => {
    if (open) {
      // Ensure categories refresh when the drawer opens (handles auth timing)
      refetchCategories();
    }
  }, [open, refetchCategories]);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.wallet_id || !formData.category_id) {
      toast.error("Please fill all required fields");
      return;
    }

    createTransaction.mutate({
      description: formData.description,
      note: formData.note,
      amount: Number(formData.amount),
      type: formData.type,
      wallet_id: formData.wallet_id,
      category_id: formData.category_id,
      date: formData.date || undefined,
    }, {
      onSuccess: () => {
        onSuccess?.();
        setFormData({
          description: "",
          note: "",
          amount: "",
          type: "E",
          wallet_id: null,
          category_id: null,
          date: null,
        });
        setOpen(false);
      },
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>Add Transaction</Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] px-3 sm:px-6 py-4 sm:py-6 lg:px-[22%] max-w-full overflow-x-hidden">
        <DrawerHeader className="px-0 relative">
          <DrawerTitle className="text-lg sm:text-xl">Add transaction</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Capture income or expense with wallet, category, and date.
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <div className="flex gap-2 rounded-md border p-2 text-sm">
                {(["I", "E"] as const).map((value) => {
                  const isActive = formData.type === value;
                  const Icon = value === "I" ? TrendingUp : TrendingDown;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      className="flex-1 justify-center"
                      onClick={() => setFormData({ ...formData, type: value })}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {value === "I" ? "Income" : "Expense"}
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
                <WalletIcon className="h-4 w-4" /> Wallet
              </Label>
              <Select
                value={formData.wallet_id?.toString() ?? undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, wallet_id: parseInt(value) })
                }
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

            <div className="grid gap-2 min-w-0">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" /> Category
              </Label>
              <Select
                value={formData.category_id?.toString() ?? undefined}
                onOpenChange={(isOpen) => isOpen && refetchCategories()}
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
            </div>
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
