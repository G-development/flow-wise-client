"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateCategory, useUpdateCategory, useCategories } from "@/lib/hooks/useQueries";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryAvatar, type CategoryColor } from "@/lib/categoryStyle";
import { cn } from "@/lib/utils";

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string | null;
  onSuccess?: () => void;
  /** Tipo proposto per una categoria nuova (la scheda aperta nella pagina Categorie). */
  defaultType?: "I" | "E";
}

type Form = { name: string; type: "I" | "E"; color: CategoryColor | null; icon: string | null };

/**
 * Crea o modifica una categoria: nome, tipo, colore e icona (13/11/2026, migrazione 017 del server).
 * La categoria "T" (Transfer) e' di sistema: la pagina non apre questo dialogo per lei.
 * Colore e icona si mandano solo se scelti o cambiati: "Auto" (null) lascia all'app un colore stabile.
 */
export default function CategoryDialog({
  isOpen,
  onClose,
  categoryId,
  onSuccess,
  defaultType = "E",
}: CategoryDialogProps) {
  const { data: categoryList = EMPTY_LIST_RESPONSE } = useCategories();
  const categories = categoryList.rows;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [form, setForm] = useState<Form>({ name: "", type: defaultType, color: null, icon: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (categoryId) {
      const category = categories.find((c) => String(c.id) === String(categoryId));
      if (category && category.type !== "T") {
        setForm({
          name: String(category.name),
          type: category.type as "I" | "E",
          color: (typeof category.color === "string" && category.color in CATEGORY_COLORS ? category.color : null) as CategoryColor | null,
          icon: typeof category.icon === "string" ? category.icon : null,
        });
      }
    } else {
      setForm({ name: "", type: defaultType, color: null, icon: null });
    }
  }, [categoryId, isOpen, categories, defaultType]);

  const editing = categories.find((c) => String(c.id) === String(categoryId));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a name");
      return;
    }
    // solo cio' che serve: colore e icona se scelti (o tolti, in modifica)
    const style: { color?: string | null; icon?: string | null } = {};
    if (form.color !== null || (editing && editing.color != null)) style.color = form.color;
    if (form.icon !== null || (editing && editing.icon != null)) style.icon = form.icon;
    try {
      if (categoryId) {
        await updateCategory.mutateAsync({ id: categoryId, data: { name: form.name.trim(), type: form.type, ...style } });
      } else {
        await createCategory.mutateAsync({ name: form.name.trim(), type: form.type, ...style });
      }
      onSuccess?.();
      onClose();
    } catch {
      // le mutation mostrano gia' il messaggio
    }
  };

  const preview = { id: categoryId ?? 0, color: form.color, icon: form.icon };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{categoryId ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>Name, type, colour and icon. The colour is also used in the charts.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-end gap-3">
            <CategoryAvatar category={preview} size="lg" />
            <div className="grid flex-1 gap-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Groceries, Fuel, Salary"
                value={form.name}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                  setError(null);
                }}
              />
            </div>
          </div>
          {error && <p className="-mt-3 text-sm text-destructive">{error}</p>}

          <div className="grid gap-2">
            <Label>Type</Label>
            <Tabs value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as "I" | "E" }))}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="E">Expense</TabsTrigger>
                <TabsTrigger value="I">Income</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color: null }))}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium",
                  form.color === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                Auto
              </button>
              {(Object.keys(CATEGORY_COLORS) as CategoryColor[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color: key }))}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition",
                    form.color === key ? "ring-2 ring-foreground" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: CATEGORY_COLORS[key] }}
                  aria-label={`Colour ${key}`}
                  aria-pressed={form.color === key}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
                const selected = (form.icon ?? "tag") === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, icon: key === "tag" ? null : key }))}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                      selected ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-secondary"
                    )}
                    aria-label={`Icon ${key}`}
                    aria-pressed={selected}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {categoryId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
