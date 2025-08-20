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
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id: string | number;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, id }) => {
  const handleDelete = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No active session");

      const response = await fetch(`${API_URL}/transaction/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Errore durante l'eliminazione");

      toast.success("Transaction deleted successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'eliminazione");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
