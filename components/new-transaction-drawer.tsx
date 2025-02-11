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

export default function NewTransactionDrawer() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    amount: number;
    category: string;
    type: string;
  }>({
    amount: 0,
    category: "",
    type: "income",
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
        }),
      });

      console.log("Dati inviati:", {
        amount: currentFormData.amount,
        category: currentFormData.category,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `${
            formData.type === "income" ? "Entrata" : "Uscita"
          } creata con successo!`,
          { position: "top-right" }
        );
        setOpen(false);
        setFormData({ amount: 0, category: "", type: "income" });
      } else {
        throw new Error(data.msg || "Si è verificato un errore");
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>New</Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Add transaction</DrawerTitle>
        </DrawerHeader>
        <Tabs
          defaultValue="income"
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          className="w-full"
        >
          <TabsList className="mb-4 flex w-full justify-center bg-muted">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <TransactionForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
            />
          </TabsContent>
          <TabsContent value="expense">
            <TransactionForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
            />
          </TabsContent>
        </Tabs>
        <DrawerClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Chiudi
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
