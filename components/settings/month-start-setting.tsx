"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MonthStartChoice } from "@/components/month-start/month-start-choice";
import { useSaveUserSettings, useUserSettings } from "@/lib/hooks/useQueries";
import { useDateRange } from "@/lib/providers/DateRangeProvider";

/**
 * Settings → Preferences: il giorno in cui parte il mese (16/11/2026). Lo stesso controllo della
 * finestra del primo accesso; salvato con `PUT /users/settings`, vale subito in dashboard e Movements.
 */
export function MonthStartSetting() {
  const { data, isLoading } = useUserSettings();
  const save = useSaveUserSettings();
  const { setMonthStartDay } = useDateRange();
  const saved = data?.monthStartDay ?? 1;
  const [day, setDay] = useState(saved);

  useEffect(() => setDay(saved), [saved]);

  if (isLoading) return <div className="mb-3 h-36 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="mb-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Start of the month</p>
        <p className="text-xs text-muted-foreground">Used by This month, Last month and Last 3 months.</p>
      </div>
      <MonthStartChoice value={day} onChange={setDay} />
      {day !== saved && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDay(saved)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              save.mutate(
                { monthStartDay: day },
                {
                  onSuccess: (result) => {
                    setMonthStartDay(result.monthStartDay ?? 1);
                    toast.success("Start of the month saved");
                  },
                }
              )
            }
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
