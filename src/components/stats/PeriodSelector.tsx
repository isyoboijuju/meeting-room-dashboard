"use client";

import { useState, useCallback } from "react";
import type { StatsQuery } from "@/hooks/useCalendarStats";
import {
  toLocalISO,
  getMondayOfWeek,
  getFridayOfWeek,
  shiftWeek,
  getMonthRange,
} from "@/lib/date-utils";
import CalendarPopup from "./CalendarPopup";

type PeriodMode = StatsQuery["mode"];

type Props = {
  query: StatsQuery;
  onQueryChange: (query: StatsQuery) => void;
};

const MODE_LABELS: Record<PeriodMode, string> = {
  week: "주간",
  month: "월간",
  custom: "기간",
};

function formatLabel(query: StatsQuery): string {
  switch (query.mode) {
    case "week": {
      const mon = new Date(query.weekOf + "T00:00:00");
      const fri = getFridayOfWeek(mon);
      const startStr = mon.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
      const endStr = fri.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} – ${endStr}`;
    }
    case "month": {
      const [y, m] = query.month.split("-").map(Number);
      return `${y}년 ${m}월`;
    }
    case "custom": {
      const s = new Date(query.startDate + "T00:00:00");
      const e = new Date(query.endDate + "T00:00:00");
      const startStr = s.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
      const endStr = e.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} – ${endStr}`;
    }
  }
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PeriodSelector({ query, onQueryChange }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const mode = query.mode;

  const handleModeChange = useCallback(
    (newMode: PeriodMode) => {
      if (newMode === mode) return;

      const today = new Date();
      switch (newMode) {
        case "week":
          onQueryChange({ mode: "week", weekOf: toLocalISO(getMondayOfWeek(today)) });
          break;
        case "month":
          onQueryChange({ mode: "month", month: toLocalISO(today).slice(0, 7) });
          break;
        case "custom": {
          // Default to current month range
          const monthStr = toLocalISO(today).slice(0, 7);
          const { start, end } = getMonthRange(monthStr);
          onQueryChange({ mode: "custom", startDate: start, endDate: end });
          break;
        }
      }
      setCalendarOpen(false);
    },
    [mode, onQueryChange]
  );

  const handlePrev = useCallback(() => {
    switch (query.mode) {
      case "week":
        onQueryChange({ mode: "week", weekOf: shiftWeek(query.weekOf, -1) });
        break;
      case "month":
        onQueryChange({ mode: "month", month: shiftMonth(query.month, -1) });
        break;
      case "custom":
        // No prev/next for custom
        break;
    }
  }, [query, onQueryChange]);

  const handleNext = useCallback(() => {
    switch (query.mode) {
      case "week":
        onQueryChange({ mode: "week", weekOf: shiftWeek(query.weekOf, 1) });
        break;
      case "month":
        onQueryChange({ mode: "month", month: shiftMonth(query.month, 1) });
        break;
      case "custom":
        break;
    }
  }, [query, onQueryChange]);

  const isCurrentPeriod = (() => {
    const today = toLocalISO(new Date());
    switch (query.mode) {
      case "week":
        return query.weekOf === toLocalISO(getMondayOfWeek(new Date()));
      case "month":
        return query.month === today.slice(0, 7);
      case "custom":
        return false;
    }
  })();

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
        {(["week", "month", "custom"] as PeriodMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              mode === m
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Navigation + label */}
      <div className="relative flex items-center gap-2">
        {mode !== "custom" && (
          <button
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
            aria-label="이전"
          >
            &#8249;
          </button>
        )}

        <button
          onClick={() => setCalendarOpen((o) => !o)}
          className="text-sm font-medium text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors duration-150 min-w-[160px] text-center border border-transparent hover:border-slate-200"
        >
          {formatLabel(query)}
        </button>

        {mode !== "custom" && (
          <button
            onClick={handleNext}
            disabled={isCurrentPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            aria-label="다음"
          >
            &#8250;
          </button>
        )}

        {calendarOpen && (
          <CalendarPopup
            mode={mode}
            query={query}
            onSelect={(q) => {
              onQueryChange(q);
              if (mode !== "custom") setCalendarOpen(false);
            }}
            onClose={() => setCalendarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
