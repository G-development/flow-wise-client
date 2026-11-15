"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSaveUserSettings, useUserSettings } from "@/lib/hooks/useQueries";
import { useDateRange } from "@/lib/providers/DateRangeProvider";
import { MonthStartChoice } from "./month-start-choice";

/**
 * Giorno di inizio del mese (16/11/2026, scelta di Gio): si sceglie al primo accesso e si cambia in
 * Settings. Montato nella navbar, quindi su ogni pagina dell'app:
 * - porta il giorno salvato nel periodo condiviso (`DateRangeProvider`), cosi' "This month" parte da li';
 * - se l'utente non ha ancora scelto (`monthStartDay` null, anche chi c'era gia'), chiede una volta.
 *   Non si chiude senza scegliere; "On the 1st" e' gia' selezionato, quindi basta un tocco.
 * Il tour dei nuovi account aspetta questa scelta (`onboarding-tour.tsx`).
 */
export function MonthStartGate() {
  const { data } = useUserSettings();
  const save = useSaveUserSettings();
  const { setMonthStartDay } = useDateRange();
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (data) setMonthStartDay(data.monthStartDay ?? 1);
  }, [data, setMonthStartDay]);

  const open = data != null && data.monthStartDay == null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>When does your month start?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;This month&quot; and &quot;Last month&quot; in the dashboard and in Movements follow this day. You can
            change it any time in Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <MonthStartChoice value={day} onChange={setDay} />
        <AlertDialogFooter>
          <Button onClick={() => save.mutate({ monthStartDay: day })} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
