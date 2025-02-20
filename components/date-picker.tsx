"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DatePickerWithRange({
  className,
  date,
  dateChange,
}: React.HTMLAttributes<HTMLDivElement> & {
  date?: DateRange;
  dateChange?: (date: DateRange | undefined) => void;
}) {
  // const [date, setDate] = React.useState<DateRange | undefined>({
  //   from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primo giorno del mese corrente
  //   to: new Date(), // Data odierna
  //   // from: addDays(new Date(), -20), //new Date(2025, 0, 20),
  //   // to: new Date(), //new Date(2025, 0, 20), 20),
  // });

  const handleDateChange = (newDate: DateRange | undefined) => {
    dateChange?.(newDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
