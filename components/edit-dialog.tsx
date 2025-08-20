import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id: string | number;
  onSuccess?: () => void;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  id,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    wallet_id: "",
    category_id: "",
    amount: "",
    date: "",
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchTransactionData = async () => {
        try {
          const session = await supabase.auth.getSession();
          const token = session?.data?.session?.access_token;
          if (!token) throw new Error("No active session");

          // recupero transazione
          const response = await fetch(`${API_URL}/transaction/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok)
            throw new Error("Errore nel recupero della transazione");
          const transaction = await response.json();

          setFormData({
            wallet_id: transaction.wallet_id?.toString() || "",
            category_id: transaction.category_id?.toString() || "",
            amount: transaction.amount?.toString() || "",
            date: transaction.date
              ? format(new Date(transaction.date), "yyyy-MM-dd")
              : "",
          });

          // recupero wallets
          const walletRes = await fetch(`${API_URL}/wallet`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!walletRes.ok) throw new Error("Errore nel recupero wallet");
          const walletData = await walletRes.json();
          setWallets(walletData);

          // recupero categorie
          const catRes = await fetch(`${API_URL}/category/active`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!catRes.ok) throw new Error("Errore nel recupero categorie");
          const cats = await catRes.json();
          setCategories(cats);
        } catch (error) {
          console.error(error);
          toast.error("Errore nel caricamento dati");
        }
      };

      fetchTransactionData();
    }
  }, [isOpen, id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
    }));
  };

  const handleSubmit = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No active session");

      const response = await fetch(`${API_URL}/transaction/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Errore durante l'update");

      toast.success("Transaction updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Errore durante l'update");
      console.error(error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit transaction</AlertDialogTitle>
          <AlertDialogDescription>
            You can modify this transaction details.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Category
            </Label>
            <Select
              onValueChange={handleCategoryChange}
              value={formData.category_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="capitalize">
                {categories.map((cat) => (
                  <SelectItem
                    className="capitalize"
                    key={cat.id}
                    value={cat.id.toString()}
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Amount
            </Label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="mt-2 w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-2 w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Wallet
            </Label>
            <Select
              onValueChange={(walletId) =>
                setFormData((prev) => ({ ...prev, wallet_id: walletId }))
              }
              value={formData.wallet_id || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a wallet" />
              </SelectTrigger>
              <SelectContent className="capitalize">
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-gray-500 text-right">
            ID transaction: {id}
          </p>
        </div>

        <AlertDialogFooter className="gap-4 sm:gap-0">
          <AlertDialogAction onClick={handleSubmit}>Save</AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditDialog;
