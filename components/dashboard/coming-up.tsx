"use client";

import Link from "next/link";
import { CalendarClock, PiggyBank } from "lucide-react";
import { useAnnualPlans, type AnnualPlanResponse } from "@/lib/hooks/useAnnualPlan";
import type { Wallet } from "@/lib/hooks/useQueries";
import { upcomingDues } from "@/lib/dashboard";
import { DashboardSection, formatEuro } from "./section";

const euroCents = (cents: number) => formatEuro(cents / 100);
const dueLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * "Coming up" (16/11/2026): quanto mettere da parte questo mese in ogni salvadanaio e le prossime
 * rate non pagate del piano annuale (prima le scadute). Parte sempre da oggi e resta a mesi di
 * calendario come il piano, qualunque periodo sia scelto. Senza salvadanai non compare.
 */
export function ComingUp({ pots }: { pots: Wallet[] }) {
  const results = useAnnualPlans(pots.map((pot) => Number(pot.id)));
  if (pots.length === 0) return null;

  const plans = results.map((r) => r.data).filter((p): p is AnnualPlanResponse => p != null);
  const loading = results.some((r) => r.isLoading);
  const deposits = plans.filter((p) => p.plan.suggestedMonthlyCents > 0);
  const dues = upcomingDues(plans, new Date(), 4);

  return (
    <DashboardSection title="Coming up" href="/annual-plan" linkLabel="Annual plan">
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        {loading && plans.length === 0 ? (
          <div className="m-3 h-12 animate-pulse rounded-xl bg-muted" />
        ) : deposits.length === 0 && dues.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">Nothing due soon.</p>
        ) : (
          <>
            {deposits.map((p) => (
              <Link
                key={`deposit-${p.wallet.id}`}
                href={`/annual-plan?wallet=${p.wallet.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PiggyBank className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">Put aside in {p.wallet.name}</span>
                  <span className="block text-xs text-muted-foreground">Suggested for this month</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{euroCents(p.plan.suggestedMonthlyCents)}</span>
              </Link>
            ))}
            {dues.map((due) => (
              <div key={`${due.potName}-${due.itemName}-${due.dueDate}`} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    due.overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CalendarClock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{due.itemName}</span>
                  <span className={`block text-xs ${due.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {due.overdue ? `Overdue since ${dueLabel(due.dueDate)}` : `Due ${dueLabel(due.dueDate)}`} · {due.potName}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{euroCents(due.amountCents)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </DashboardSection>
  );
}
