"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory, useCategories } from "@/lib/hooks/useQueries";
import { toast } from "sonner";

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string | null;
  onSuccess?: () => void;
}

export default function CategoryDialog({
  isOpen,
  onClose,
  categoryId,
  onSuccess,
}: CategoryDialogProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
  });

  // Se siamo in edit mode, popola i dati
  useEffect(() => {
    if (categoryId && isOpen && categories.length > 0) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        const normalizedType = (category.type as string).toLowerCase();
        setFormData({
          name: category.name,
          type: normalizedType === "income" || normalizedType === "i" ? "income" : "expense",
        });
      }
    } else if (!categoryId && isOpen) {
      // Reset per nuovo
      setFormData({ name: "", type: "expense" });
    }
  }, [categoryId, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (categoryId) {
        // Update
        await updateCategory.mutateAsync({
          id: categoryId,
          data: { name: formData.name, type: formData.type },
        });
        toast.success("Category updated");
      } else {
        // Create
        await createCategory.mutateAsync({
          name: formData.name,
          type: formData.type,
        });
        toast.success("Category created");
      }

      onSuccess?.();
      onClose();
      setFormData({ name: "", type: "expense" });
    } catch {
      toast.error("Error saving category");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoryId ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {categoryId ? "Edit category details" : "Create a new category to organize transactions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="Es: Alimentari, Benzina, Stipendio"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as "income" | "expense",
                }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {categoryId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
