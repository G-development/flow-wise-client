import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TransactionFormProps {
  formData: {
    amount: number;
    category: string;
    type: string;
  };
  setFormData: (data: {
    amount: number;
    category: string;
    type: string;
  }) => void;
  handleSubmit: () => void;
}

export default function TransactionForm({
  formData,
  setFormData,
  handleSubmit,
}: TransactionFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Importo</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: parseFloat(e.target.value) })
          }
        />
      </div>
      <div>
        <Label>Categoria</Label>
        <Input
          type="text"
          placeholder="Categoria"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        />
      </div>
      <Button className="mt-4 w-full" onClick={handleSubmit}>
        Aggiungi {formData.type === "income" ? "Entrata" : "Uscita"}
      </Button>
    </div>
  );
}
