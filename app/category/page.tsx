"use client";

import { useState } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useCategories, useUpdateCategory, useDeleteCategory } from "@/lib/hooks/useQueries";
import { toast } from "sonner";
import { Plus, Pencil, Trash } from "lucide-react";
import CategoryDialog from "@/components/category-dialog";
import DeleteDialog from "@/components/delete-dialog";

interface Category {
  id: string;
  name: string;
  type: string;
  userid: string;
  active: boolean;
}

export default function Categories() {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleActive = (category: Category) => {
    updateCategory.mutate(
      {
        id: category.id,
        data: { active: !category.active },
      },
      {
        onError: () => {
          toast.error("Failed to update category");
        },
      }
    );
  };

  const handleDelete = (category: Category) => {
    setSelectedId(category.id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    try {
      await deleteCategory.mutateAsync(selectedId);
      toast.success("Category deleted");
      refetch();
      setDeleteOpen(false);
      setSelectedId(null);
    } catch {
      toast.error("Error deleting category");
    }
  };

  const handleEditOpen = (categoryId: string) => {
    setEditingId(categoryId);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  return (
    <>
      <Navbar />
      <main className="app-page">
        {/* Header */}
        <div className="app-page-header">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-description">
              Organize your transactions with custom categories
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
            <p className="text-destructive font-medium">Error loading categories</p>
          </div>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first category
            </Button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && categories.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <DynamicTable
              data={categories.map((c) => {
                const type = c.type?.toLowerCase();
                const isIncome = type === "income" || type === "i";
                const label = isIncome ? "Income" : "Expense";
                const badgeClass = isIncome
                  ? "border-0 bg-success/10 text-success hover:bg-success/15"
                  : "border-0 bg-destructive/10 text-destructive hover:bg-destructive/15";

                return {
                  Name: c.name,
                  Type: <Badge className={`${badgeClass} font-medium`}>{label}</Badge>,
                  Active: (
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => toggleActive(c)}
                    />
                  ),
                };
              })}
              caption={`Hai ${categories.length} categor${categories.length === 1 ? "ia" : "ie"}.`}
              renderActions={(row) => (
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditOpen(row.Name as string)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Modifica</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const category = categories.find((c) => c.name === row.Name);
                      if (category) handleDelete(category);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Elimina</span>
                  </Button>
                </div>
              )}
            />
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CategoryDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        categoryId={editingId}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        id={selectedId}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteConfirm}
      />
    </>
  );
}
