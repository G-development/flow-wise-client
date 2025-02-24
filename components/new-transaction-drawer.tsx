"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

import TransactionForm from "@/components/new-transaction-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface NewTransactionDrawerProps {
  fetchData: () => void;
  disableIncome?: boolean;
  disableExpense?: boolean;
}

export default function NewTransactionDrawer({
  fetchData,
  disableIncome = false,
  disableExpense = false,
}: NewTransactionDrawerProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    amount: string;
    category: string;
    type: string;
    date: string;
  }>({
    amount: "",
    category: "",
    type: disableExpense ? "income" : "expense",
    date: new Date().toISOString().split("T")[0],
  });
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null); // Stato per il token

  useEffect(() => {
    const storedToken = localStorage.getItem("fw-token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken); // Salva il token nello stato
  }, [router]);

  const formDataRef = useRef(formData); // Crea una ref per i dati del form

  useEffect(() => {
    formDataRef.current = formData; // Mantieni sempre sincronizzata la ref
  }, [formData]);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Token non trovato. Effettua il login.");
      return;
    }

    const currentFormData = formDataRef.current;

    try {
      console.log(`${API_URL}/${formData.type}/new`);
      const response = await fetch(`${API_URL}/${formData.type}/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: currentFormData.amount,
          category: currentFormData.category,
          date: currentFormData.date,
        }),
      });

      console.log("Dati inviati:", {
        amount: currentFormData.amount,
        category: currentFormData.category,
        date: currentFormData.date,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `${
            formData.type === "income" ? "Income" : "Expense"
          } creata con successo!`,
          { position: "top-right" }
        );
        fetchData();
        setOpen(false);
        setFormData({
          amount: "",
          category: "",
          type: disableExpense ? "income" : "expense",
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        throw new Error(data.msg || "An error has occurred");
      }
    } catch (error) {
      toast.error((error as Error).message, { position: "top-right" });
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center justify-end">
          <Button>
            New{" "}
            {disableIncome
              ? "expense"
              : disableExpense
              ? "income"
              : "transaction"}
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Add transaction</DrawerTitle>
        </DrawerHeader>
        <Tabs
          defaultValue={disableExpense ? "income" : "expense"}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          className="w-full"
        >
          {!disableExpense && !disableIncome ? (
            <TabsList className="mb-4 flex w-full justify-center bg-muted">
              {!disableIncome && (
                <TabsTrigger value="income">Income</TabsTrigger>
              )}
              {!disableExpense && (
                <TabsTrigger value="expense">Expense</TabsTrigger>
              )}
            </TabsList>
          ) : null}
          {!disableIncome && (
            <TabsContent value="income">
              <TransactionForm
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
              />
            </TabsContent>
          )}
          {!disableExpense && (
            <TabsContent value="expense">
              <TransactionForm
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
              />
            </TabsContent>
          )}
        </Tabs>
        <DrawerClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Cancel
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
