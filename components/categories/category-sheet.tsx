"use client";

import { useState } from "react";
import { GitMerge, Pencil, Plus, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { Category } from "@/lib/hooks/useQueries";
import { CategoryAvatar } from "@/lib/categoryStyle";
import {
  useCreateRule,
  useDeleteRule,
  useMergeCategory,
  type CategoryRule,
  type CategoryStat,
} from "@/lib/hooks/useCategoryManagement";

const euro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

/**
 * Dettaglio di una categoria (13/11/2026): numeri, regole che la assegnano in automatico (si
 * vedono, si tolgono e se ne aggiungono a mano), unione in un'altra categoria dello stesso tipo,
 * attiva/disattiva, rinomina ed eliminazione (solo se non ha movimenti).
 */
export function CategorySheet({
  category,
  stat,
  rules,
  year,
  sameType,
  onClose,
  onRename,
  onToggleActive,
  onDelete,
}: {
  category: Category | null;
  stat: CategoryStat | undefined;
  rules: CategoryRule[];
  year: number;
  sameType: Category[];
  onClose: () => void;
  onRename: (id: string) => void;
  onToggleActive: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();
  const merge = useMergeCategory();
  const [keyword, setKeyword] = useState("");
  const [intoId, setIntoId] = useState("");
  const [confirmMerge, setConfirmMerge] = useState(false);

  const open = category != null;
  const isSystem = category?.type === "T";
  const movements = stat?.movements ?? 0;
  const target = sameType.find((c) => String(c.id) === intoId);

  const addRule = () => {
    if (!category || keyword.trim().length < 2) return;
    createRule.mutate({ keyword, category_id: Number(category.id) }, { onSuccess: () => setKeyword("") });
  };

  const doMerge = () => {
    if (!category || !target) return;
    merge.mutate(
      { id: String(category.id), intoId: Number(target.id) },
      {
        onSuccess: () => {
          setConfirmMerge(false);
          setIntoId("");
          onClose();
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {category && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 pr-8">
                <CategoryAvatar category={category} />
                <span className="truncate">{category.name}</span>
                {!isSystem && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onRename(String(category.id))} title="Edit name, colour and icon">
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Rename</span>
                  </Button>
                )}
              </SheetTitle>
              <SheetDescription>
                {isSystem ? "System category for transfers between your wallets." : category.type === "I" ? "Income category" : "Expense category"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Figure label="Movements" value={String(movements)} />
              <Figure label={`In ${year}`} value={euro(stat?.yearCents ?? 0)} />
              <Figure label="Rules" value={String(rules.length)} />
            </div>
            {stat?.lastUsed && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last used {new Date(stat.lastUsed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}

            {!isSystem && (
              <section className="mt-6 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Rules</h3>
                  <p className="text-xs text-muted-foreground">
                    A bank movement whose text contains one of these words gets this category by itself. Flow Wise
                    learns them from your corrections; you can add or remove them.
                  </p>
                </div>
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rules yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {rules.map((rule) => (
                      <span
                        key={rule.id}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 py-0.5 pl-2.5 pr-1 text-xs"
                        title={rule.source === "learned" ? "Learned from a correction" : "Added by hand"}
                      >
                        {rule.keyword}
                        {rule.type !== category.type && <span className="text-muted-foreground">· {rule.type === "I" ? "in" : "out"}</span>}
                        <button
                          type="button"
                          onClick={() => deleteRule.mutate(rule.id)}
                          disabled={deleteRule.isPending}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                          aria-label={`Remove rule ${rule.keyword}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && addRule()}
                    placeholder="e.g. lidl, netflix"
                    aria-label="New rule keyword"
                  />
                  <Button variant="outline" onClick={addRule} disabled={createRule.isPending || keyword.trim().length < 2}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
              </section>
            )}

            {!isSystem && sameType.length > 0 && (
              <section className="mt-6 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Merge into another category</h3>
                  <p className="text-xs text-muted-foreground">
                    Its movements, rules and budgets move to the other category, then this one is deleted.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select value={intoId} onValueChange={setIntoId}>
                    <SelectTrigger aria-label="Merge into">
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {sameType.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" disabled={!target || merge.isPending} onClick={() => setConfirmMerge(true)}>
                    <GitMerge className="mr-1 h-4 w-4" /> Merge
                  </Button>
                </div>
              </section>
            )}

            {!isSystem && (
              <section className="mt-6 space-y-3 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Inactive categories are hidden when you add a movement.</p>
                  </div>
                  <Switch checked={category.active !== false} onCheckedChange={() => onToggleActive(category)} />
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={movements > 0}
                  onClick={() => onDelete(String(category.id))}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {movements > 0 ? "Delete (move or merge its movements first)" : "Delete category"}
                </Button>
              </section>
            )}
          </>
        )}
      </SheetContent>

      <AlertDialog open={confirmMerge} onOpenChange={setConfirmMerge}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Merge “{category?.name}” into “{target?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {movements} {movements === 1 ? "movement" : "movements"} and {rules.length}{" "}
              {rules.length === 1 ? "rule" : "rules"} move to “{target?.name}”, then “{category?.name}” is deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={merge.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                doMerge();
              }}
              disabled={merge.isPending}
            >
              {merge.isPending ? "Merging…" : "Merge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-2 py-2.5">
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

