"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { normalizeStartDay, presetRange, type PeriodPreset } from "@/lib/period";

type DateRangeContextValue = {
  /** Date del periodo scelto; `undefined` = "All time". */
  dateRange: DateRange | undefined;
  /** Imposta date a mano (calendario): il periodo diventa "custom". */
  setDateRange: (range: DateRange | undefined) => void;
  /** Scorciatoia attuale ("this-month", …, "custom"). */
  preset: PeriodPreset;
  setPreset: (preset: PeriodPreset) => void;
  /** Giorno in cui parte il mese dell'utente (1–31; 1 finche' non e' caricato o scelto). */
  monthStartDay: number;
  setMonthStartDay: (day: number) => void;
};

const DateRangeContext = createContext<DateRangeContextValue | undefined>(undefined);

/**
 * Periodo condiviso da dashboard e Movements (16/11/2026). Si tiene la scorciatoia, non le date:
 * cosi' quando arriva il giorno di inizio del mese dell'utente (`MonthStartGate`) "This month" si
 * ricalcola da solo. Le date a mano restano tali e quali ("custom").
 */
export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<PeriodPreset>("this-month");
  const [custom, setCustom] = useState<DateRange | undefined>(undefined);
  const [monthStartDay, setMonthStartDayState] = useState(1);

  const setPreset = useCallback(
    (next: PeriodPreset) => {
      if (next === "custom") {
        // si parte dalle date attuali, poi il calendario le cambia
        setCustom((prev) => prev ?? presetRange(preset, monthStartDay) ?? presetRange("this-month", monthStartDay));
      }
      setPresetState(next);
    },
    [preset, monthStartDay]
  );
  const setDateRange = useCallback((range: DateRange | undefined) => {
    setCustom(range);
    setPresetState("custom");
  }, []);
  const setMonthStartDay = useCallback((day: number) => setMonthStartDayState(normalizeStartDay(day)), []);

  const dateRange = useMemo(
    () => (preset === "custom" ? custom : presetRange(preset, monthStartDay)),
    [preset, custom, monthStartDay]
  );

  return (
    <DateRangeContext.Provider
      value={{ dateRange, setDateRange, preset, setPreset, monthStartDay, setMonthStartDay }}
    >
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
