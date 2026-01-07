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
import { apiFetch, getAuthToken } from "@/lib/api";

interface DeleteDialogProps {
  isOpen: boolean;
  id: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  id,
  onClose,
  onSuccess,
}) => {
  const handleDelete = async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No active session");

      const response = await apiFetch(
        `/transaction/${id}`,
        {
          method: "DELETE",
        },
        token
      );

      if (!response.ok) throw new Error("Errore durante l'eliminazione");

      toast.success("Transaction deleted successfully");
      onSuccess?.();
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
