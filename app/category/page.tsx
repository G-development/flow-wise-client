"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, ChevronDown, ChevronRight, Inbox, Plus, Tags } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryDialog from "@/components/category-dialog";
import DeleteDialog from "@/components/delete-dialog";
import { TruncatedNotice } from "@/components/truncated-notice";
import { CategorySheet } from "@/components/categories/category-sheet";
import { ReviewSheet, isReviewCategory } from "@/components/categories/review-sheet";
import { useCategories, useDeleteCategory, useUpdateCategory, type Category } from "@/lib/hooks/useQueries";
import { useCategoryRules, useCategoryStats, type CategoryStat } from "@/lib/hooks/useCategoryManagement";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { toast } from "sonner";
import { CategoryAvatar } from "@/lib/categoryStyle";

const euro = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

/**
 * Pagina Categorie (rifatta il 13/11/2026 con Gio). Spese ed entrate in due schede, ogni categoria
 * con quanto pesa (movimenti, totale dell'anno, regole), ordinate dalla piu' usata; in fondo quelle
 * mai usate e quelle inattive. Toccando una categoria si apre il dettaglio (regole, unione, attiva,
 * elimina). In alto il riquadro "To review" con i movimenti ancora in Altro / Other o da classificare.
 * La categoria di sistema dei trasferimenti sta a parte: si rinomina e basta.
 */
export default function Categories() {
  const { data: list = EMPTY_LIST_RESPONSE, isLoading, isError } = useCategories();
  const { data: statsData } = useCategoryStats();
  const { data: rules = [] } = useCategoryRules();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [tab, setTab] = useState<"E" | "I">("E");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const categories = list.rows as Category[];
  const stats = statsData?.stats ?? {};
  const year = statsData?.year ?? new Date().getFullYear();
  const statOf = (id: string | number): CategoryStat | undefined => stats[String(id)];
  const transfer = categories.find((c) => c.type === "T");

  const groups = useMemo(() => {
    const ofType = categories.filter((c) => c.type === tab);
    const used = (c: Category) => (statOf(c.id)?.movements ?? 0) > 0;
    const byUse = (a: Category, b: Category) =>
      (statOf(b.id)?.movements ?? 0) - (statOf(a.id)?.movements ?? 0) || String(a.name).localeCompare(String(b.name));
    return {
      active: ofType.filter((c) => c.active !== false && used(c)).sort(byUse),
      unused: ofType.filter((c) => c.active !== false && !used(c)).sort(byUse),
      inactive: ofType.filter((c) => c.active === false).sort(byUse),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, tab, statsData]);

  const counts = {
    E: categories.filter((c) => c.type === "E").length,
    I: categories.filter((c) => c.type === "I").length,
  };
  const reviewCount = categories
    .filter((c) => isReviewCategory(String(c.name)))
    .reduce((sum, c) => sum + (statOf(c.id)?.movements ?? 0), 0);

  const opened = categories.find((c) => String(c.id) === openId) ?? null;

  const toggleActive = (category: Category) => {
    updateCategory.mutate(
      { id: String(category.id), data: { active: category.active === false } },
      { onError: () => toast.error("Failed to update category") }
    );
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      setOpenId(null);
    } catch {
      // la mutation notifica gia' l'errore
    } finally {
      setDeleteId(null);
    }
  };

  const row = (c: Category) => {
    const stat = statOf(c.id);
    const ruleCount = rules.filter((r) => String(r.category_id) === String(c.id)).length;
    return (
      <button
        key={c.id}
        type="button"
        onClick={() => setOpenId(String(c.id))}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
      >
        <CategoryAvatar category={c} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{c.name}</span>
          <span className="block text-xs text-muted-foreground">
            {stat?.movements ?? 0} {(stat?.movements ?? 0) === 1 ? "movement" : "movements"}
            {ruleCount > 0 && ` · ${ruleCount} ${ruleCount === 1 ? "rule" : "rules"}`}
          </span>
        </span>
        {(stat?.yearCents ?? 0) !== 0 && (
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{euro(stat?.yearCents ?? 0)}</span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
      </button>
    );
  };

  const block = (title: string, items: Category[], hint?: string) =>
    items.length > 0 && (
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-baseline justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <div className="divide-y divide-border/60">{items.map(row)}</div>
      </section>
    );

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="app-page-header">
            <div>
              <h1 className="page-title">Categories</h1>
              <p className="page-description">What your money goes to and comes from, and the rules that sort it.</p>
            </div>
            <Button onClick={() => { setEditingId(null); setDialogOpen(true); }} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add category
            </Button>
          </div>

          {isError && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Could not load the categories.
            </p>
          )}
          {list.truncated && <TruncatedNotice shown={list.count} total={list.total} />}

          {reviewCount > 0 && (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left transition-colors hover:bg-amber-500/15"
            >
              <div className="rounded-xl bg-amber-500/15 p-2.5">
                <Inbox className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{reviewCount} movements to review</span>
                <span className="block text-sm text-muted-foreground">
                  Still in a fallback category. Give them a real one: Flow Wise learns from it.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}

          <Tabs value={tab} onValueChange={(value) => setTab(value as "E" | "I")}>
            <TabsList className="grid w-full grid-cols-2 sm:w-80">
              <TabsTrigger value="E">Expenses ({counts.E})</TabsTrigger>
              <TabsTrigger value="I">Income ({counts.I})</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {block("In use", groups.active, `${year}`)}
              {block("Not used yet", groups.unused)}
              {groups.active.length + groups.unused.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <Tags className="mx-auto mb-2 h-5 w-5" />
                  No {tab === "E" ? "expense" : "income"} categories yet.
                </div>
              )}
              {groups.inactive.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowInactive(!showInactive)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {showInactive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Inactive ({groups.inactive.length})
                  </button>
                  {showInactive && block("Inactive", groups.inactive)}
                </div>
              )}
            </>
          )}

          {transfer && (
            <button
              type="button"
              onClick={() => setOpenId(String(transfer.id))}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm hover:bg-secondary/60"
            >
              <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{transfer.name}</span>
                <span className="block text-xs text-muted-foreground">
                  System category for transfers · {statOf(transfer.id)?.movements ?? 0} movements
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </div>
      </main>

      <CategorySheet
        category={opened}
        stat={opened ? statOf(opened.id) : undefined}
        rules={opened ? rules.filter((r) => String(r.category_id) === String(opened.id)) : []}
        year={year}
        sameType={opened ? categories.filter((c) => c.type === opened.type && c.type !== "T" && String(c.id) !== String(opened.id)) : []}
        onClose={() => setOpenId(null)}
        onRename={(id) => { setEditingId(id); setDialogOpen(true); }}
        onToggleActive={toggleActive}
        onDelete={(id) => setDeleteId(id)}
      />

      <ReviewSheet open={reviewOpen} onClose={() => setReviewOpen(false)} categories={categories} />

      <CategoryDialog
        isOpen={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingId(null); }}
        categoryId={editingId}
        defaultType={tab}
      />

      <DeleteDialog
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        title="Delete category?"
        description="This category has no movements. It will be deleted with its rules."
        onConfirm={confirmDelete}
        isPending={deleteCategory.isPending}
      />
    </>
  );
}
