/**
 * Periodi dell'app con il "mese" dell'utente (16/11/2026).
 *
 * L'utente sceglie il giorno in cui parte il suo mese (1–31, `Profile.settings.monthStartDay` sul
 * server; 1 finche' non sceglie). "This month", "Last month" e "Last 3 months" in dashboard e in
 * Movements partono da quel giorno. Nei mesi piu' corti si usa l'ultimo giorno disponibile: con 31,
 * a novembre il mese parte il 30. Il piano annuale resta a mesi di calendario e non usa questo file.
 *
 * Tutto in date locali a mezzanotte: niente UTC, che sposterebbe i giorni.
 */

export type PeriodPreset = "this-month" | "last-month" | "last-3" | "all" | "custom";
export type Range = { from: Date; to: Date };

export const PERIOD_OPTIONS: { value: Exclude<PeriodPreset, "custom">; label: string }[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3", label: "Last 3 months" },
  { value: "all", label: "All time" },
];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Il giorno valido (1–31), o 1 se manca o non e' valido. */
export function normalizeStartDay(day: unknown): number {
  return Number.isInteger(day) && (day as number) >= 1 && (day as number) <= 31 ? (day as number) : 1;
}

/** Il giorno in cui parte il mese `month` (0–11) di `year`, tagliato alla fine dei mesi corti. */
export function monthStartIn(year: number, month: number, startDay: number): Date {
  // new Date normalizza mesi fuori intervallo (es. -1 = dicembre dell'anno prima)
  const anchor = new Date(year, month, 1);
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  return new Date(y, m, Math.min(normalizeStartDay(startDay), daysInMonth(y, m)));
}

/** Inizio del mese dell'utente che contiene `day`, spostato di `offset` mesi (0 = quello di `day`). */
export function periodStart(day: Date, startDay: number, offset = 0): Date {
  const today = startOfDay(day);
  let start = monthStartIn(today.getFullYear(), today.getMonth(), startDay);
  let monthIndex = today.getMonth();
  if (start > today) {
    monthIndex -= 1;
    start = monthStartIn(today.getFullYear(), monthIndex, startDay);
  }
  return offset === 0 ? start : monthStartIn(today.getFullYear(), monthIndex + offset, startDay);
}

/** Le date di una scorciatoia; `undefined` per "All time" (nessun filtro) e per "custom". */
export function presetRange(preset: PeriodPreset, startDay: number, now: Date = new Date()): Range | undefined {
  const today = startOfDay(now);
  switch (preset) {
    case "this-month":
      return { from: periodStart(today, startDay), to: today };
    case "last-month":
      return { from: periodStart(today, startDay, -1), to: addDays(periodStart(today, startDay), -1) };
    case "last-3":
      return { from: periodStart(today, startDay, -2), to: today };
    default:
      return undefined;
  }
}

/** Giorni tra due date, estremi compresi. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000) + 1;
}

/**
 * Il periodo con cui confrontare quello scelto (sezione "This month" della dashboard):
 * - "This month": lo stesso punto del mese precedente (stessi giorni dall'inizio, senza superarne la fine);
 * - un altro periodo con date: quello subito prima, della stessa lunghezza;
 * - "All time": nessun confronto.
 */
export function comparisonRange(
  preset: PeriodPreset,
  range: Range | undefined,
  startDay: number,
  now: Date = new Date()
): Range | undefined {
  if (!range) return undefined;
  if (preset === "this-month") {
    const prevStart = periodStart(now, startDay, -1);
    const prevEnd = addDays(periodStart(now, startDay), -1);
    const sameDay = addDays(prevStart, daysBetween(range.from, range.to) - 1);
    return { from: prevStart, to: sameDay > prevEnd ? prevEnd : sameDay };
  }
  if (preset === "last-month") {
    return { from: periodStart(now, startDay, -2), to: addDays(periodStart(now, startDay, -1), -1) };
  }
  const length = daysBetween(range.from, range.to);
  const to = addDays(range.from, -1);
  return { from: addDays(to, -(length - 1)), to };
}

/** "1–15 Nov", "27 Oct – 26 Nov", "30 Dec 2025 – 5 Jan 2026": l'etichetta breve di un periodo. */
export function rangeLabel(range: Range, now: Date = new Date()): string {
  const sameYear = range.from.getFullYear() === range.to.getFullYear();
  const withYear = !sameYear || range.to.getFullYear() !== now.getFullYear();
  const fmt = (d: Date, year: boolean) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
  if (sameYear && range.from.getMonth() === range.to.getMonth()) {
    return `${range.from.getDate()}–${fmt(range.to, withYear)}`;
  }
  return `${fmt(range.from, !sameYear)} – ${fmt(range.to, withYear)}`;
}
