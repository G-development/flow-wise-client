"use client";

import { useState } from "react";
import { CategoryAvatar, categoryHex } from "@/lib/categoryStyle";
import type { Category } from "@/lib/hooks/useQueries";
import type { CategorySpend } from "@/lib/dashboard";
import { ChangeLabel, DashboardSection, formatEuro } from "./section";

const SHOWN = 6;

/**
 * "Where the money goes" (16/11/2026): spese nette per categoria nel periodo, dalla piu' alta, con la
 * variazione rispetto al periodo di confronto. Barre nel colore della categoria; le prime 6, poi "Show all".
 */
export function CategorySpending({
  rows,
  categories,
  hasComparison,
  loading,
}: {
  rows: CategorySpend[];
  categories: Map<string, Category>;
  hasComparison: boolean;
  loading: boolean;
}) {
  const [all, setAll] = useState(false);
  const max = rows[0]?.amount ?? 0;
  const shown = all ? rows : rows.slice(0, SHOWN);

  return (
    <DashboardSection title="Where the money goes">
      <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No expenses in this period.</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((row) => {
              const category = categories.get(row.categoryId);
              const hex = categoryHex(category);
              return (
                <li key={row.categoryId} className="flex items-center gap-3">
                  <CategoryAvatar category={category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{String(category?.name ?? "No category")}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{formatEuro(row.amount)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${max > 0 ? Math.max(2, (row.amount / max) * 100) : 0}%`, backgroundColor: hex }}
                        />
                      </div>
                      {hasComparison && (
                        <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                          {row.change === null ? "new" : <ChangeLabel change={row.change} />}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {rows.length > SHOWN && (
          <button
            type="button"
            onClick={() => setAll(!all)}
            className="mt-3 w-full rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-secondary"
          >
            {all ? "Show less" : `Show all (${rows.length})`}
          </button>
        )}
      </div>
    </DashboardSection>
  );
}
