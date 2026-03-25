"use client";

import { useRef, useEffect, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { ko } from "date-fns/locale";
import { toLocalISO, getMondayOfWeek, getFridayOfWeek } from "@/lib/date-utils";
import type { StatsQuery } from "@/hooks/useCalendarStats";
import "react-day-picker/style.css";

type Props = {
  mode: StatsQuery["mode"];
  query: StatsQuery;
  onSelect: (query: StatsQuery) => void;
  onClose: () => void;
};

export default function CalendarPopup({ mode, query, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const defaultMonth = (() => {
    switch (query.mode) {
      case "week":
        return new Date(query.weekOf + "T00:00:00");
      case "month": {
        const [y, m] = query.month.split("-").map(Number);
        return new Date(y, m - 1, 1);
      }
      case "custom":
        return new Date(query.startDate + "T00:00:00");
    }
  })();

  if (mode === "week") {
    return (
      <WeekPicker
        ref={ref}
        defaultMonth={defaultMonth}
        query={query}
        onSelect={onSelect}
      />
    );
  }

  if (mode === "month") {
    return (
      <MonthPicker
        ref={ref}
        defaultMonth={defaultMonth}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
  }

  return (
    <RangePicker
      ref={ref}
      defaultMonth={defaultMonth}
      query={query}
      onSelect={onSelect}
    />
  );
}

// --- Week Picker ---
import React from "react";

const WeekPicker = React.forwardRef<
  HTMLDivElement,
  { defaultMonth: Date; query: StatsQuery; onSelect: (q: StatsQuery) => void }
>(function WeekPicker({ defaultMonth, query, onSelect }, ref) {
  const selected = query.mode === "week"
    ? (() => {
        const mon = getMondayOfWeek(new Date(query.weekOf + "T00:00:00"));
        const fri = getFridayOfWeek(new Date(query.weekOf + "T00:00:00"));
        return { from: mon, to: fri };
      })()
    : undefined;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-3">
      <DayPicker
        mode="range"
        locale={ko}
        defaultMonth={defaultMonth}
        selected={selected}
        onDayClick={(day) => {
          const monday = getMondayOfWeek(day);
          onSelect({ mode: "week", weekOf: toLocalISO(monday) });
        }}
        showOutsideDays
        classNames={{
          today: "font-bold text-indigo-600",
          selected: "bg-indigo-100 text-indigo-900",
          range_start: "bg-indigo-500 text-white rounded-l-md",
          range_end: "bg-indigo-500 text-white rounded-r-md",
          range_middle: "bg-indigo-100 text-indigo-900",
        }}
      />
    </div>
  );
});

// --- Month Picker ---
const MonthPicker = React.forwardRef<
  HTMLDivElement,
  { defaultMonth: Date; onSelect: (q: StatsQuery) => void; onClose: () => void }
>(function MonthPicker({ defaultMonth, onSelect, onClose }, ref) {
  const [year, setYear] = useState(defaultMonth.getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => i);
  const currentMonth = defaultMonth.getMonth();

  return (
    <div ref={ref} className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-4 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
        >
          &#8249;
        </button>
        <span className="text-sm font-semibold text-slate-800">{year}년</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
        >
          &#8250;
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m) => {
          const isSelected = year === defaultMonth.getFullYear() && m === currentMonth;
          return (
            <button
              key={m}
              onClick={() => {
                const month = `${year}-${String(m + 1).padStart(2, "0")}`;
                onSelect({ mode: "month", month });
                onClose();
              }}
              className={`
                py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${isSelected
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                }
              `}
            >
              {m + 1}월
            </button>
          );
        })}
      </div>
    </div>
  );
});

// --- Range Picker ---
const RangePicker = React.forwardRef<
  HTMLDivElement,
  { defaultMonth: Date; query: StatsQuery; onSelect: (q: StatsQuery) => void }
>(function RangePicker({ defaultMonth, query, onSelect }, ref) {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (query.mode === "custom") {
      return {
        from: new Date(query.startDate + "T00:00:00"),
        to: new Date(query.endDate + "T00:00:00"),
      };
    }
    return undefined;
  });

  return (
    <div ref={ref} className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl border border-slate-200 shadow-xl p-3">
      <DayPicker
        mode="range"
        locale={ko}
        defaultMonth={defaultMonth}
        selected={range}
        onSelect={(newRange) => {
          setRange(newRange);
          if (newRange?.from && newRange?.to) {
            onSelect({
              mode: "custom",
              startDate: toLocalISO(newRange.from),
              endDate: toLocalISO(newRange.to),
            });
          }
        }}
        numberOfMonths={2}
        showOutsideDays
        classNames={{
          today: "font-bold text-indigo-600",
          selected: "bg-indigo-100 text-indigo-900",
          range_start: "bg-indigo-500 text-white rounded-l-md",
          range_end: "bg-indigo-500 text-white rounded-r-md",
          range_middle: "bg-indigo-100 text-indigo-900",
        }}
      />
      {range?.from && !range?.to && (
        <p className="text-xs text-slate-400 text-center mt-1">종료일을 선택하세요</p>
      )}
    </div>
  );
});
