"use client";

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

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  /** Esegue la cancellazione: la mutation e il suo toast restano al chiamante. */
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

/**
 * Dialog di conferma generico.
 *
 * Prima era legato a `useDeleteTransaction`, quindi ogni uso cancellava una
 * transazione a prescindere da cosa si stesse eliminando (la pagina categorie
 * finiva per chiamare `DELETE /transaction/:id` con un id di categoria).
 */
export default function DeleteDialog({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  isPending = false,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
