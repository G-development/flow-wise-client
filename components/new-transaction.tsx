"use client";
import React from "react";
import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Wallet = {
  id: number;
  name: string;
  balance: number;
};

type Category = {
  id: number;
  name: string;
  type: "I" | "E";
};

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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    description: "",
    note: "",
    amount: "",
    type: "E",
    wallet_id: null,
    category_id: null,
    date: null,
  });
  const [token, setToken] = useState<string | null>(null);

  // Ottieni token Supabase quando il componente monta
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (open && token) {
      // fetch wallets con auth header
      fetch(`${API_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setWallets(Array.isArray(data) ? data : []))
        .catch(console.error);

      // fetch categories
      fetch(`${API_URL}/category/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [open, token]);

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  const handleSubmit = async () => {
    if (!token) {
      console.error("No token available");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating transaction:", errorData);
        return;
      }

      if (response.ok && onSuccess) {
        onSuccess(); // refresh
        toast.success("Transaction created!");
      }

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
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>Add Transaction</Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90%] p-4 lg:px-[25%]">
        <DrawerHeader>
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
