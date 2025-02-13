import { useState, useEffect } from "react";
import { format } from 'date-fns';
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
  // Stato per i campi del modulo
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: "",
  });

  // Carica i dati della transazione quando il dialogo si apre
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
          console.log(transaction.date);
          
          setFormData({
            category: transaction.category,
            amount: transaction.amount.toString(),
            date: format(transaction.date, 'yyyy-MM-dd'),
            // date: new Date(transaction.date).toLocaleDateString(),
            // date: "2025-01-01",
          });
        } catch (error) {
          console.error(error);
        }
      };

      fetchTransactionData();
    }
  }, [isOpen, transactionType, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        } updated succesfully`
      );
      fetchData(); // Ricarica i dati
      onClose(); // Chiudi il dialogo
    } catch (error) {
      toast.error("Error while editing");
      console.error(error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Modifica Transazione</AlertDialogTitle>
          <AlertDialogDescription>
            Puoi modificare i dettagli di questa transazione.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Categoria
            </Label>
            <Input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-2 w-full p-2 border rounded-md"
              disabled={true}
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Importo
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
              Data
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
          <p className="text-xs text-gray-500 text-right">ID transaction: {id}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={handleSubmit}>Salva</AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>Annulla</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditDialog;
