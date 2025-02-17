"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DatePickerWithRange from "@/components/date-picker";
import Navbar from "@/components/navbar";
import SimpleTable from "@/components/table";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Category {
  _id: string;
  name: string;
  type: string;
}

interface Budget {
  _id: string;
  category?: Category;
  [key: string]: unknown;
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    amount: string;
    category: string;
    period: string;
  }>({
    amount: "",
    category: "",
    period: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense",
  });
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("fw-token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/budget/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/category/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!budgetsRes.ok || !categoriesRes.ok)
        throw new Error("Token is not valid");

      const data = await categoriesRes.json();

      setBudgets(await budgetsRes.json());
      setCategories(data.category);
    } catch (error) {
      console.error(error);
      setError("An error occurred while fetching data.");
      localStorage.removeItem("fw-token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem("fw-token");
      const response = await fetch(`${API_URL}/category/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) throw new Error("Error adding category");
      setNewCategory({ name: "", type: "expense" });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    const { amount, category, period } = formData;
    if (!amount || !category) {
      setError("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("fw-token");
      const response = await fetch(`${API_URL}/budget/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, category, period }),
      });

      if (!response.ok) {
        throw new Error("Error creating budget");
      }

      setFormData({ amount: "", category: "", period: "" });
      fetchData(); // Ricarica i dati aggiornati
      setOpen(false); // Chiudi il drawer
    } catch (error) {
      console.error(error);
      setError("An error occurred while submitting the budget.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Budgets - WIP</h1>
          <DatePickerWithRange />
        </div>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <div className="flex items-center justify-center">
              <Button className="w-[95%] mt-4 mb-4">New transaction</Button>
            </div>
          </DrawerTrigger>
          <DrawerContent className="p-4">
            <DrawerHeader>
              <DrawerTitle>Define a new budget</DrawerTitle>
            </DrawerHeader>

            <div className="flex flex-col gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  min={1}
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: String(e.target.value) || "",
                    })
                  }
                />
              </div>

              <div>
                <Label>Category</Label>
                <div className="flex items-center justify-center gap-8">
                  {loading ? (
                    <p>Loading...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : categories.filter((cat) => cat.type === "expense")
                      .length > 0 ? (
                    <Select
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                      value={formData.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((cat) => cat.type === "expense")
                          .map((cat) => (
                            <SelectItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p>No categories found for {"expense"}! 😞</p>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>Create new category</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>New category</AlertDialogTitle>
                      </AlertDialogHeader>
                      <div className="flex flex-col gap-4 p-4">
                        <Label>Name</Label>
                        <Input
                          type="text"
                          placeholder="Category name"
                          value={newCategory.name}
                          onChange={(e) =>
                            setNewCategory({
                              ...newCategory,
                              name: e.target.value,
                            })
                          }
                        />
                        <Label>Type</Label>
                        <Select value="expense">
                          <SelectTrigger disabled>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>

                        <Label>Period</Label>
                        <Select value="expense">
                          <SelectTrigger disabled>
                            <SelectValue placeholder="Period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">always</SelectItem>
                            {/* <SelectItem value="expense">monthly</SelectItem>
                          <SelectItem value="expense">weekly</SelectItem> */}
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddCategory}>
                          Add
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <Button className="mt-4 w-full" onClick={handleSubmit}>
              Add budget
            </Button>

            <DrawerClose asChild>
              <Button variant="outline" className="mt-4 w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>

        <SimpleTable
          data={budgets}
          fetchData={fetchData}
          caption="Budgets | This page is WIP"
          transactionType="budget"
        />
      </div>
    </>
  );
}
