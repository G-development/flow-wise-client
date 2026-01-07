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
import { useDeleteTransaction } from "@/lib/hooks/useQueries";

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
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = () => {
    deleteTransaction.mutate(String(id), {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
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
