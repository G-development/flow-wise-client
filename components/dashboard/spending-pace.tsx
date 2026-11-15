"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DashboardSection, formatEuro } from "./section";

const config: ChartConfig = {
  current: { label: "This period", color: "hsl(var(--primary))" },
  previous: { label: "Before", color: "hsl(var(--muted-foreground))" },
};

/**
 * "Spending pace" (16/11/2026): spese cumulate giorno per giorno nel periodo scelto, accanto a quelle
 * del periodo precedente (con "This month": tutto il mese scorso). Si vede subito se si sta spendendo
 * piu' in fretta del solito.
 */
export function SpendingPace({
  current,
  previous,
  previousLabel,
  ongoing,
}: {
  current: number[];
  previous: number[];
  previousLabel: string;
  /** Periodo ancora in corso ("This month"): il confronto e' "a questo punto", non sul totale. */
  ongoing: boolean;
}) {
  const when = ongoing ? " at this point" : "";
  const length = Math.max(current.length, previous.length);
  if (length < 2) return null;
  const data = Array.from({ length }, (_, i) => ({
    day: i + 1,
    current: i < current.length ? current[i] : null,
    previous: i < previous.length ? previous[i] : null,
  }));
  const now = current[current.length - 1] ?? 0;
  const before = previous[Math.min(current.length, previous.length) - 1] ?? 0;
  const diff = Math.round((now - before) * 100) / 100;

  return (
    <DashboardSection title="Spending pace">
      <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
        <p className="text-sm">
          {diff === 0 ? (
            <>Same as {previousLabel}{when}.</>
          ) : (
            <>
              <span className={`font-semibold tabular-nums ${diff > 0 ? "text-destructive" : "text-success"}`}>
                {formatEuro(Math.abs(diff))} {diff > 0 ? "more" : "less"}
              </span>{" "}
              than {previousLabel}
              {when}.
            </>
          )}
        </p>
        <ChartContainer config={config} className="mt-2 aspect-auto h-40 w-full">
          <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} fontSize={11} />
            <YAxis hide domain={[0, "auto"]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => `Day ${payload?.[0]?.payload?.day ?? ""}`}
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-3">
                      <span className="text-muted-foreground">{config[String(name)]?.label}</span>
                      <span className="font-mono font-medium tabular-nums">{formatEuro(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Line dataKey="previous" type="monotone" stroke="var(--color-previous)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line dataKey="current" type="monotone" stroke="var(--color-current)" strokeWidth={2.5} dot={false} connectNulls={false} />
          </LineChart>
        </ChartContainer>
        <div className="mt-1 flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-primary" /> This period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t border-dashed border-muted-foreground" /> {previousLabel}
          </span>
        </div>
      </div>
    </DashboardSection>
  );
}
