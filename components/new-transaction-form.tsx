import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Category {
  _id: string;
  name: string;
  type: string;
}

interface TransactionFormProps {
  formData: {
    amount: string;
    category: string;
    type: string;
    date: string;
  };
  setFormData: (data: {
    amount: string;
    category: string;
    type: string;
    date: string;
  }) => void;
  handleSubmit: () => void;
}

export default function TransactionForm({
  formData,
  setFormData,
  handleSubmit,
}: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", type: "income" });

  useEffect(() => {
    const token = localStorage.getItem("fw-token");
    if (!token) {
      toast.error("Token non trovato. Effettua il login.", {
        position: "top-right",
      });
      return;
    }

    async function fetchCategories() {
      try {
        const response = await fetch(`${API_URL}/category/all`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Error while fetching categories");
        const data = await response.json();

        setCategories(data.category);
      } catch (err) {
        setError("Impossible to load categories" + err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  async function handleAddCategory() {
    const token = localStorage.getItem("fw-token");
    if (!token) {
      toast.error("Token non trovato. Effettua il login.", {
        position: "top-right",
      });
      return;
    }

    if (!newCategory.name.trim()) {
      toast.error("Inserisci un nome valido per la categoria.", {
        position: "top-right",
      });
      return;
    }

    try {
      console.log(newCategory);

      const response = await fetch(`${API_URL}/category/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok)
        throw new Error("Errore nella creazione della categoria");

      const data = await response.json();
      setCategories([...categories, data]);
      toast.success("Categoria aggiunta con successo!", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Errore durante l'aggiunta della categoria." + error, {
        position: "top-right",
      });
    }
  }

  return (
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
          ) : categories.filter((cat) => cat.type === formData.type).length >
            0 ? (
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
                  .filter((cat) => cat.type === formData.type)
                  .map((cat) => (
                    <SelectItem key={cat._id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No categories found for {formData.type}! 😞</p>
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
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
                <Label>Type</Label>
                <Select
                  value={newCategory.type}
                  onValueChange={(value) => {
                    setNewCategory({ ...newCategory, type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli il tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
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

      <div>
        <Label className="block text-sm font-medium text-gray-700">Date</Label>
        <Input
          type="date"
          name="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-2 w-full p-2 border rounded-md"
          required
        />
      </div>

      <Button className="mt-4 w-full" onClick={handleSubmit}>
        Add {formData.type === "income" ? "Income" : "Expense"}
      </Button>
    </div>
  );
}
