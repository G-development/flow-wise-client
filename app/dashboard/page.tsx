"use client";

import { Suspense, useMemo } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import Navbar from "@/components/navbar";
import { OnboardingTour } from "@/components/onboarding-tour";
import NewTransaction from "@/components/new-transaction";
import { Button } from "@/components/ui/button";
import { PeriodPicker } from "@/components/period-picker";
import { TotalBalanceWidget } from "@/components/dashboard/total-balance";
import { ToFix } from "@/components/dashboard/to-fix";
import { PeriodSummary } from "@/components/dashboard/period-summary";
import { ComingUp } from "@/components/dashboard/coming-up";
import { CategorySpending } from "@/components/dashboard/category-spending";
import { SpendingPace } from "@/components/dashboard/spending-pace";
import { DashboardSection } from "@/components/dashboard/section";
import { isReviewCategory } from "@/components/categories/review-sheet";
import { useCategories, useMovements, useTransfers, useWallets, type Transaction } from "@/lib/hooks/useQueries";
import { useDateRange } from "@/lib/providers/DateRangeProvider";
import { EMPTY_LIST_RESPONSE } from "@/lib/listResponse";
import { movementTotals } from "@/lib/movements";
import { comparisonRange, daysBetween, presetRange, rangeLabel, type Range } from "@/lib/period";
import { categorySpending, cumulativeSpending, inRange, pendingTransfersIn } from "@/lib/dashboard";

const toIsoDay = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : undefined);

/**
 * Dashboard fissa (16/11/2026, deciso con Gio: niente piu' griglia personalizzabile). Dall'alto:
 * periodo (condiviso con Movements), saldo, "To fix" (solo se c'e' qualcosa nel periodo), il periodo
 * con il confronto, "Coming up" (salvadanai e piano annuale), spese per categoria, ritmo delle spese.
 * Il periodo segue il giorno di inizio del mese dell'utente (`lib/period.ts`).
 */
export default function Dashboard() {
  const { dateRange, preset, monthStartDay } = useDateRange();

  const range: Range | undefined =
    dateRange?.from ? { from: dateRange.from, to: dateRange.to ?? dateRange.from } : undefined;
  // Confronto: con "This month" lo stesso punto del mese prima; la linea del ritmo mostra tutto il mese prima.
  const comparison = comparisonRange(preset, range, monthStartDay);
  const previousFull = preset === "this-month" ? presetRange("last-month", monthStartDay) : comparison;

  const { data: current = EMPTY_LIST_RESPONSE, isLoading } = useMovements(toIsoDay(range?.from), toIsoDay(range?.to));
  const { data: previous = EMPTY_LIST_RESPONSE, isLoading: previousLoading } = useMovements(
    toIsoDay(previousFull?.from),
    toIsoDay(previousFull?.to),
    previousFull != null
  );
  const { data: transfers = EMPTY_LIST_RESPONSE } = useTransfers();
  const { data: categoryList = EMPTY_LIST_RESPONSE } = useCategories();
  const { data: wallets = [] } = useWallets();

  const categories = categoryList.rows;
  const categoryById = useMemo(() => new Map(categories.map((c) => [String(c.id), c])), [categories]);
  const pots = useMemo(() => wallets.filter((w) => w.kind === "pot"), [wallets]);

  const currentRows = current.rows as Transaction[];
  const comparisonRows = useMemo(
    () => (comparison ? inRange(previous.rows as Transaction[], comparison.from, comparison.to) : []),
    [previous.rows, comparison?.from.getTime(), comparison?.to.getTime()] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const totals = movementTotals(currentRows);
  const previousTotals = comparison && !previousLoading ? movementTotals(comparisonRows) : null;

  const reviewIds = useMemo(
    () => new Set(categories.filter((c) => isReviewCategory(String(c.name))).map((c) => String(c.id))),
    [categories]
  );
  const toReview = currentRows.filter((t) => t.type !== "T" && reviewIds.has(String(t.category_id))).length;
  const pendingTransfers = pendingTransfersIn(transfers.rows as Transaction[], range).length;

  const spending = useMemo(() => categorySpending(currentRows, comparisonRows), [currentRows, comparisonRows]);

  const pace = useMemo(() => {
    if (!range || !previousFull) return null;
    const days = daysBetween(range.from, range.to);
    if (days < 2 || days > 92) return null;
    return {
      current: cumulativeSpending(currentRows, range.from, days),
      previous: cumulativeSpending(previous.rows as Transaction[], previousFull.from, daysBetween(previousFull.from, previousFull.to)),
    };
  }, [currentRows, previous.rows, range?.from.getTime(), range?.to.getTime(), previousFull?.from.getTime(), previousFull?.to.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const comparisonLabel = comparison ? rangeLabel(comparison) : null;
  const previousLabel = preset === "this-month" ? "last month" : preset === "last-month" ? "the month before" : "the period before";

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-description">{range ? rangeLabel(range) : "All time"}</p>
            </div>
            <div data-tour="widgets" className="flex w-full items-center gap-2 sm:w-auto">
              <PeriodPicker />
              {/* Su mobile c'e' gia' il + della barra in basso (navbar): qui solo da desktop. */}
              <div className="hidden lg:block">
                <NewTransaction
                  trigger={
                    <Button data-tour="new" className="gap-2 font-semibold shadow-md" aria-label="Add transaction">
                      <Plus className="h-4 w-4" />
                      <span>Add Transaction</span>
                    </Button>
                  }
                />
              </div>
            </div>
          </div>

          <TotalBalanceWidget />

          <ToFix pendingTransfers={pendingTransfers} toReview={toReview} />

          <DashboardSection
            title={preset === "this-month" ? "This month so far" : "This period"}
            href="/movements"
            linkLabel="Movements"
          >
            <PeriodSummary totals={totals} previous={previousTotals} comparisonLabel={comparisonLabel} loading={isLoading} />
          </DashboardSection>

          <ComingUp pots={pots} />

          <CategorySpending
            rows={spending}
            categories={categoryById}
            hasComparison={comparison != null && !previousLoading}
            loading={isLoading}
          />

          {pace && !isLoading && !previousLoading && (
            <SpendingPace
              current={pace.current}
              previous={pace.previous}
              previousLabel={previousLabel}
              ongoing={preset === "this-month" || preset === "last-3"}
            />
          )}
        </div>
      </main>
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>
    </>
  );
}
