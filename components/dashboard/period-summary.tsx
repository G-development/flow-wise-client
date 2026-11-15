import type { MovementTotals } from "@/lib/movements";
import { percentChange } from "@/lib/dashboard";
import { ChangeLabel, formatEuro } from "./section";

/**
 * Entrate, spese e netto del periodo scelto (16/11/2026), con la variazione rispetto al periodo di
 * confronto (`comparisonRange` in `lib/period.ts`): con "This month" lo stesso punto del mese prima.
 */
export function PeriodSummary({
  totals,
  previous,
  comparisonLabel,
  loading,
}: {
  totals: MovementTotals;
  previous: MovementTotals | null;
  comparisonLabel: string | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Figure
          label="Income"
          value={totals.income}
          className="text-success"
          change={previous ? percentChange(totals.income, previous.income) : null}
          loading={loading}
        />
        <Figure
          label="Expenses"
          value={totals.expense}
          change={previous ? percentChange(totals.expense, previous.expense) : null}
          loading={loading}
        />
        <Figure
          label="Net"
          value={totals.net}
          className={totals.net < 0 ? "text-destructive" : "text-success"}
          change={null}
          extra={previous ? netDifference(totals.net - previous.net) : undefined}
          loading={loading}
        />
      </div>
      {comparisonLabel && <p className="px-1 text-xs text-muted-foreground">Compared with {comparisonLabel}</p>}
    </div>
  );
}

function Figure({
  label,
  value,
  className = "",
  change,
  extra,
  loading,
}: {
  label: string;
  value: number;
  className?: string;
  change: number | null;
  extra?: string;
  loading: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-1 h-6 animate-pulse rounded bg-muted" />
      ) : (
        <p className={`truncate text-base font-semibold tabular-nums sm:text-lg ${className}`}>{formatEuro(value)}</p>
      )}
      <p className="truncate text-[11px] text-muted-foreground">
        {change !== null ? <ChangeLabel change={change} /> : extra ?? " "}
      </p>
    </div>
  );
}

/** Di quanto e' cambiato il netto rispetto al confronto: "+519,52 €", "−12,00 €", "same". */
function netDifference(diff: number) {
  const rounded = Math.round(diff * 100) / 100;
  if (rounded === 0) return "same";
  return `${rounded > 0 ? "+" : "−"}${formatEuro(Math.abs(rounded))}`;
}
