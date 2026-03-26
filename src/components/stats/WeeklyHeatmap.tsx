"use client";

import React, { useState, useRef, useMemo } from "react";
import { HeatmapCell } from "@/lib/types";

type Props = {
  cells: HeatmapCell[];
  title?: string;
  weekStartDate?: string;
};

type Interval = "1h" | "30m";

const DAYS = ["월", "화", "수", "목", "금"];

const SLOTS_30M = Array.from({ length: 21 }, (_, i) => ({
  hour: Math.floor(i / 2) + 9,
  minute: (i % 2) * 30,
}));

const SLOTS_1H = Array.from({ length: 11 }, (_, i) => ({
  hour: i + 9,
  minute: 0,
}));

// Indigo gradient: slate-100 → indigo-100 → indigo-300 → indigo-500 → indigo-700
const INTENSITY_COLORS = [
  "#F1F5F9", // 0: slate-100
  "#E0E7FF", // low: indigo-100
  "#A5B4FC", // medium: indigo-300
  "#6366F1", // high: indigo-500
  "#4338CA", // very high: indigo-700
];

function cellBackground(count: number, maxCount: number): string {
  if (count === 0) return INTENSITY_COLORS[0];
  const ratio = count / Math.max(maxCount, 1);
  if (ratio > 0.75) return INTENSITY_COLORS[4];
  if (ratio > 0.5) return INTENSITY_COLORS[3];
  if (ratio > 0.25) return INTENSITY_COLORS[2];
  return INTENSITY_COLORS[1];
}

function cellTextColor(count: number, maxCount: number): string {
  if (count === 0) return "#94A3B8"; // slate-400
  const ratio = count / Math.max(maxCount, 1);
  return ratio > 0.5 ? "#FFFFFF" : "#312E81"; // white or indigo-900
}

type TooltipState = {
  day: number;
  hour: number;
  minute: number;
  count: number;
  rooms: string[];
  x: number;
  y: number;
  intervalMin: number;
} | null;

function getDayLabels(weekStartDate?: string): string[] {
  if (!weekStartDate) return DAYS;
  const [y, m, d] = weekStartDate.split("-").map(Number);
  const ref = new Date(y, m - 1, d);
  const dow = (ref.getDay() + 6) % 7;
  const monday = new Date(y, m - 1, d - dow);
  return DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return `${day}(${date.getMonth() + 1}/${date.getDate()})`;
  });
}

function aggregateToHourly(cells: HeatmapCell[]): Map<string, { count: number; rooms: string[] }> {
  const map = new Map<string, { count: number; rooms: Set<string> }>();
  for (const cell of cells) {
    const key = `${cell.day}-${cell.hour}-0`;
    const existing = map.get(key);
    if (existing) {
      existing.count = Math.max(existing.count, cell.count);
      for (const r of cell.rooms) existing.rooms.add(r);
    } else {
      map.set(key, { count: cell.count, rooms: new Set(cell.rooms) });
    }
  }
  const result = new Map<string, { count: number; rooms: string[] }>();
  for (const [key, val] of map) {
    result.set(key, { count: val.count, rooms: Array.from(val.rooms) });
  }
  return result;
}

export default function WeeklyHeatmap({ cells, title = "주간 예약 히트맵", weekStartDate }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [interval, setInterval] = useState<Interval>("30m");
  const containerRef = useRef<HTMLDivElement>(null);

  const slots = interval === "30m" ? SLOTS_30M : SLOTS_1H;
  const intervalMin = interval === "30m" ? 30 : 60;

  const cellMap30m = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    for (const cell of cells) {
      map.set(`${cell.day}-${cell.hour}-${cell.minute}`, cell);
    }
    return map;
  }, [cells]);

  const cellMap1h = useMemo(() => aggregateToHourly(cells), [cells]);

  const activeCellMap = interval === "30m" ? cellMap30m : cellMap1h;

  const maxCount = useMemo(() => {
    let max = 1;
    for (const val of activeCellMap.values()) {
      const c = "count" in val ? val.count : 0;
      if (c > max) max = c;
    }
    return max;
  }, [activeCellMap]);

  return (
    <div ref={containerRef} className="bg-white border border-slate-200/60 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-700">
          {title}
        </h3>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setInterval("1h")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              interval === "1h"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            1시간
          </button>
          <button
            onClick={() => setInterval("30m")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              interval === "30m"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            30분
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px repeat(5, 1fr)",
            gridTemplateRows: `24px repeat(${slots.length}, 1fr)`,
            gap: "3px",
            minWidth: "320px",
          }}
        >
          <div />

          {getDayLabels(weekStartDate).map((label, idx) => (
            <div
              key={idx}
              className="text-center text-sm font-semibold text-slate-500 flex items-center justify-center"
            >
              {label}
            </div>
          ))}

          {slots.map(({ hour, minute }) => {
            const key = `${hour}-${minute}`;
            return (
              <React.Fragment key={key}>
                <div className="text-right text-xs text-slate-400 pr-2 flex items-center justify-end">
                  {hour}:{minute.toString().padStart(2, "0")}
                </div>

                {DAYS.map((_, dayIdx) => {
                  const cellKey = `${dayIdx}-${hour}-${minute}`;
                  const cellData = activeCellMap.get(cellKey);
                  const count = cellData?.count ?? 0;
                  const rooms = cellData?.rooms ?? [];
                  const bg = cellBackground(count, maxCount);
                  const textColor = cellTextColor(count, maxCount);

                  return (
                    <div
                      key={`${dayIdx}-${key}`}
                      className={`rounded-md flex items-center justify-center text-xs font-medium cursor-default transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400 select-none ${
                        interval === "30m" ? "h-5" : "h-8"
                      }`}
                      style={{ backgroundColor: bg, color: textColor }}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        if (!containerRect) return;
                        setTooltip({
                          day: dayIdx,
                          hour,
                          minute,
                          count,
                          rooms,
                          x: rect.left - containerRect.left + rect.width / 2,
                          y: rect.top - containerRect.top,
                          intervalMin,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
        <span>낮음</span>
        {INTENSITY_COLORS.slice(1).map((color, i) => (
          <div
            key={i}
            className="w-6 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>높음</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
        >
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-[200px]">
            <p className="font-semibold mb-1">
              {DAYS[tooltip.day]} {tooltip.hour}:{tooltip.minute.toString().padStart(2, "0")}–{Math.floor((tooltip.hour * 60 + tooltip.minute + tooltip.intervalMin) / 60)}:{((tooltip.hour * 60 + tooltip.minute + tooltip.intervalMin) % 60).toString().padStart(2, "0")}
            </p>
            <p className="text-slate-300">
              {tooltip.count}건 예약
            </p>
            {tooltip.rooms.length > 0 && (
              <p className="text-slate-400 mt-1 leading-relaxed">
                {tooltip.rooms.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
