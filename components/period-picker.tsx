"use client";

import DatePickerWithRange from "@/components/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_OPTIONS, type PeriodPreset } from "@/lib/period";
import { useDateRange } from "@/lib/providers/DateRangeProvider";

/**
 * Periodo in un menu compatto (dashboard e Movements, condiviso): le scorciatoie, che partono dal
 * giorno di inizio del mese dell'utente (`lib/period.ts`), piu' "Custom…" che mostra il calendario.
 * Su telefono il calendario va a capo sotto il menu, senza uscire dallo schermo (15/11).
 */
export function PeriodPicker() {
  const { dateRange, setDateRange, preset, setPreset } = useDateRange();
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
      <Select value={preset} onValueChange={(value) => setPreset(value as PeriodPreset)}>
        <SelectTrigger className="w-40" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <DatePickerWithRange className="w-full sm:w-auto" date={dateRange} dateChange={setDateRange} />
      )}
    </div>
  );
}
