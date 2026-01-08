"use client";
import React from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useWallets, useCategories, useCreateTransaction } from "@/lib/hooks/useQueries";

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
  const { data: categories = [] } = useCategories();
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

  const filteredCategories = categories.filter(
    (cat) => cat.active && cat.type === (formData.type === "I" ? "income" : "expense")
  );

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
      <DrawerContent className="max-h-[90%] p-4 sm:p-6 lg:px-[25%]">
        <DrawerHeader className="px-0">
          <DrawerTitle>New Transaction</DrawerTitle>
          <DrawerDescription>Fill in the details below</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>

        <div className="space-y-4 mt-2">
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <Textarea
            placeholder="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value ? parseFloat(e.target.value) : "",
              })
            }
          />

          <div>
            <p className="mb-1 font-medium">Type</p>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "I" | "E" })
              }
              className="flex space-x-4"
            >
              <RadioGroupItem value="I" id="income" />
              <label htmlFor="income">Income</label>
              <RadioGroupItem value="E" id="expense" />
              <label htmlFor="expense">Expense</label>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="date" className="px-1">
              Date
            </Label>
            <div className="relative flex gap-2">
              <Input
                id="date"
                type="date"
                value={formData.date ?? ""}
                placeholder="June 01, 2025"
                className="bg-background pr-10"
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <p className="mb-1 font-medium">Wallet</p>
            <Select
              value={formData.wallet_id?.toString() ?? undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, wallet_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Wallet" />
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

          <div>
            <p className="mb-1 font-medium">Category</p>
            <Select
              value={formData.category_id?.toString() ?? undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter className="mt-4">
          <Button onClick={handleSubmit} className="w-full">
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
