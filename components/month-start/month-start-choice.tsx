"use client";

import { CalendarDays, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ordinal = (day: number) => {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${day}th`;
  return `${day}${{ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th"}`;
};

/** "Calendar months: November is 1–30 Nov." sul mese in corso. */
function calendarHint(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const month = now.toLocaleDateString("en-GB", { month: "long" });
  const short = now.toLocaleDateString("en-GB", { month: "short" });
  return `Calendar months: ${month} is 1–${last.getDate()} ${short}.`;
}

/** "Your month runs from the 27th to the 26th" (o "the 1st to the end of the month"). */
export function monthStartSummary(day: number) {
  if (day === 1) return "Your month runs from the 1st to the end of the month.";
  return `Your month runs from the ${ordinal(day)} to the ${ordinal(day - 1)} of the next month.`;
}

/**
 * Scelta del giorno in cui parte il mese (16/11/2026): "dal 1°" oppure "dallo stipendio", con il
 * giorno da 1 a 31. Usata nella finestra del primo accesso e in Settings.
 */
export function MonthStartChoice({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  const payday = value !== 1;
  return (
    <div className="space-y-2">
      <Option
        selected={!payday}
        onSelect={() => onChange(1)}
        icon={CalendarDays}
        title="On the 1st"
        hint={calendarHint()}
      />
      <Option
        selected={payday}
        onSelect={() => !payday && onChange(27)}
        icon={Wallet}
        title="On payday"
        hint="Each month starts on the day your salary usually arrives."
      >
        {payday && (
          <div className="mt-3 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <span className="text-sm text-muted-foreground">Day</span>
            <Select value={String(value)} onValueChange={(day) => onChange(Number(day))}>
              <SelectTrigger className="h-9 w-24" aria-label="Payday">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {DAYS.filter((day) => day !== 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Option>
      <p className="px-1 text-xs text-muted-foreground">
        {monthStartSummary(value)}
        {value > 28 ? " Shorter months start on their last day." : ""} The annual plan stays on calendar months.
      </p>
    </div>
  );
}

function Option({
  selected,
  onSelect,
  icon: Icon,
  title,
  hint,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof CalendarDays;
  title: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/70 hover:bg-secondary/60"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-primary" : "border-muted-foreground/40"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Icon className="h-4 w-4 text-muted-foreground" /> {title}
          </span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
          {children}
        </span>
      </div>
    </div>
  );
}
