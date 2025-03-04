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
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: string;
  id: string;
  fetchData: () => void;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  transactionType,
  id,
  fetchData,
}) => {
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: "",
  });

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    if (isOpen) {
      const fetchTransactionData = async () => {
        try {
          const token = localStorage.getItem("fw-token");
          const response = await fetch(`${API_URL}/${transactionType}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Errore nel recupero dei dati");

          const transaction = await response.json();

          setFormData({
            category: transaction.category._id, // Salviamo l'ID della categoria
            amount: transaction.amount.toString(),
            date: format(new Date(transaction.date), "yyyy-MM-dd"),
          });

          setCategories(transaction.alternativeCategories || []);
        } catch (error) {
          console.error(error);
        }
      };

      fetchTransactionData();
    }
  }, [isOpen, transactionType, id]);

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
      category: categoryId,
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("fw-token");
      const response = await fetch(`${API_URL}/${transactionType}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error while editing");

      toast.success(
        `${
          transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
        } updated successfully`
      );
      fetchData();
      onClose();
    } catch (error) {
      toast.error("Error while editing");
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
              value={formData.category || "Select a category"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="capitalize">
                {categories.map((cat) => (
                  <SelectItem
                    className="capitalize"
                    key={cat._id}
                    value={cat.name}
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
