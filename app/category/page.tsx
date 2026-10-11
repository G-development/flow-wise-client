"use client";

import { useState } from "react";
import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { useCategories, useUpdateCategory, useDeleteCategory } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { TruncatedNotice } from "@/components/truncated-notice";
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
  const { data: categoryList = EMPTY_LIST_RESPONSE, isLoading, isError, refetch } =
    useCategories();
  // Il server risponde con l'envelope di lista: le righe stanno in `rows`.
  const categories = categoryList.rows;
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

  const handleDelete = (categoryId: string) => {
    setSelectedId(categoryId);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    try {
      await deleteCategory.mutateAsync(selectedId);
      // La mutation invalida già la cache; refetch riallinea questo elenco.
      refetch();
    } catch {
      // l'errore è già notificato dalla mutation
    } finally {
      setDeleteOpen(false);
      setSelectedId(null);
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

        {/* Elenco parziale: il server dichiara di aver tagliato il set */}
        {!isLoading && !isError && categoryList.truncated && (
          <TruncatedNotice
            shown={categoryList.count}
            total={categoryList.total}
            className="mb-4"
          />
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
                const isIncome = c.type === "I";
                const label = isIncome ? "Income" : "Expense";
                const badgeClass = isIncome
                  ? "border-0 bg-success/10 text-success hover:bg-success/15"
                  : "border-0 bg-destructive/10 text-destructive hover:bg-destructive/15";

                return {
                  // Id presente nei dati ma nascosto: serve alle azioni, non all'utente
                  Id: c.id,
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
              hiddenColumns={["Id"]}
              caption={`Hai ${categories.length} categor${categories.length === 1 ? "ia" : "ie"}.`}
              renderActions={(row) => (
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEditOpen(String(row.Id))}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Modifica</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(String(row.Id))}
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
        isOpen={deleteOpen}
        title="Delete category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        isPending={deleteCategory.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
