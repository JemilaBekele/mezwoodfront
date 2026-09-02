"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  ETHIOPIAN_MONTHS,
  gregorianToEthiopian,
  ethiopianToGregorian,
} from "@/lib/format";

interface EthiopianDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  minDate?: Date;
}

export function EthiopianDatePicker({
  value,
  onChange,
  minDate,
}: EthiopianDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const today = React.useMemo(() => {
    return gregorianToEthiopian(new Date());
  }, []);

  const selected = React.useMemo(() => {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return null;

    return gregorianToEthiopian(date);
  }, [value]);

  const [year, setYear] = React.useState(
    selected?.year ?? today.year
  );

  const [month, setMonth] = React.useState(
    selected?.month ?? today.month
  );

  const [view, setView] = React.useState<"calendar" | "months" | "years">(
    "calendar"
  );

  /*
   * Keep the calendar synchronized when the selected value
   * changes from outside, for example "Use Calculated Date".
   */
  React.useEffect(() => {
    if (selected) {
      setYear(selected.year);
      setMonth(selected.month);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const daysInMonth = month === 13 ? 5 : 30;

  const handleSelectDay = (day: number) => {
    const gregorian = ethiopianToGregorian({
      year,
      month,
      date: day,
    });

    const formatted = [
      gregorian.getFullYear(),
      String(gregorian.getMonth() + 1).padStart(2, "0"),
      String(gregorian.getDate()).padStart(2, "0"),
    ].join("-");

    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);

      const selectedDate = new Date(`${formatted}T00:00:00`);

      if (selectedDate < min) {
        return;
      }
    }

    onChange(formatted);
    setOpen(false);
    setView("calendar");
  };

  const goPreviousMonth = () => {
    if (month === 1) {
      setMonth(13);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 13) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const isDisabled = (day: number) => {
    if (!minDate) return false;

    const gregorian = ethiopianToGregorian({
      year,
      month,
      date: day,
    });

    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);

    gregorian.setHours(0, 0, 0, 0);

    return gregorian < min;
  };

  /*
   * Years around the current selected year.
   * This makes jumping between years much easier.
   */
  const years = React.useMemo(() => {
    const startYear = Math.max(1900, year - 10);
    const endYear = year + 10;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [year]);

  const selectMonth = (monthIndex: number) => {
    setMonth(monthIndex + 1);
    setView("calendar");
  };

  const selectYear = (selectedYear: number) => {
    setYear(selectedYear);
    setView("calendar");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (!isOpen) {
          setView("calendar");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-start rounded-lg border-slate-300 text-left text-xs font-normal"
        >
          <Calendar className="mr-2 h-4 w-4 text-slate-500" />

          {selected ? (
            <span className="font-medium">
              {selected.date}{" "}
              {ETHIOPIAN_MONTHS[selected.month - 1]}{" "}
              {selected.year}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Select Ethiopian date
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[340px] p-3"
        align="start"
      >
        {/* =========================
            MONTH SELECTOR
        ========================== */}
        {view === "months" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("calendar")}
              >
                ← Back
              </Button>

              <span className="text-sm font-semibold">
                Select Month
              </span>

              <div className="w-[60px]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ETHIOPIAN_MONTHS.map((monthName, index) => {
                const isSelected = month === index + 1;

                return (
                  <Button
                    key={monthName}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => selectMonth(index)}
                    className="h-9 justify-between text-xs"
                  >
                    {monthName}

                    {isSelected && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================
            YEAR SELECTOR
        ========================== */}
        {view === "years" && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("calendar")}
              >
                ← Back
              </Button>

              <span className="text-sm font-semibold">
                Select Year
              </span>

              <div className="w-[60px]" />
            </div>

            <div className="grid max-h-[280px] grid-cols-4 gap-2 overflow-y-auto pr-1">
              {years.map((itemYear) => {
                const isSelected = year === itemYear;

                return (
                  <Button
                    key={itemYear}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => selectYear(itemYear)}
                    className="h-9 text-xs"
                  >
                    {itemYear}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================
            CALENDAR
        ========================== */}
        {view === "calendar" && (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {/* Month */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setView("months")}
                  className="h-8 px-2 text-sm font-semibold"
                >
                  {ETHIOPIAN_MONTHS[month - 1]}
                </Button>

                {/* Year */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setView("years")}
                  className="h-8 px-2 text-sm font-semibold"
                >
                  {year}
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week days */}
            <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from(
                { length: daysInMonth },
                (_, index) => {
                  const day = index + 1;

                  const disabled = isDisabled(day);

                  const isSelected =
                    selected?.year === year &&
                    selected?.month === month &&
                    selected?.date === day;

                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        isSelected ? "default" : "ghost"
                      }
                      disabled={disabled}
                      onClick={() => handleSelectDay(day)}
                      className="h-9 w-9 p-0 text-xs"
                    >
                      {day}
                    </Button>
                  );
                }
              )}
            </div>

            {/* Today shortcut */}
            <div className="mt-3 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-8 w-full text-xs"
                onClick={() => {
                  setYear(today.year);
                  setMonth(today.month);
                }}
              >
                Today — {today.date}{" "}
                {ETHIOPIAN_MONTHS[today.month - 1]}{" "}
                {today.year}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}