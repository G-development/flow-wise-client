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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: string;
  id: string;
  fetchData: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  transactionType,
  id,
  fetchData,
}) => {
  const deleteTransaction = async () => {

    try {
      const token = localStorage.getItem("fw-token");
      const response = await fetch(
        `${API_URL}/${transactionType}/delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok)
        // throw new Error(`Error while deleting ${transactionType}`);
        toast.error(`Error while deleting ${transactionType}`);

      fetchData();
      onClose(); // Close dialog
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={deleteTransaction}>
            Confirm
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
