"use client";

import React, { createContext, useContext, useState } from "react";
import { DateRange } from "react-day-picker";

type DateRangeContextValue = {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
};

const DateRangeContext = createContext<DateRangeContextValue | undefined>(
  undefined
);

export function DateRangeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = new Date();
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  });

  const setDateRange = (range: DateRange | undefined) => {
    setDateRangeState(range);
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
