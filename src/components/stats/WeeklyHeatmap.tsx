"use client";

import React, { useState, useRef } from "react";
import { HeatmapCell } from "@/lib/types";

type Props = {
  cells: HeatmapCell[];
  title?: string;
  weekStartDate?: string;
};

const DAYS = ["월", "화", "수", "목", "금"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);

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
  count: number;
  rooms: string[];
  x: number;
  y: number;
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

export default function WeeklyHeatmap({ cells, title = "주간 예약 히트맵", weekStartDate }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell);
  }

  return (
    <div ref={containerRef} className="bg-white border border-slate-200/60 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out relative">
      <h3 className="text-base font-semibold text-slate-700 mb-3">
        {title}
      </h3>

      <div className="overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px repeat(5, 1fr)",
            gridTemplateRows: `24px repeat(${HOURS.length}, 1fr)`,
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

          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div className="text-right text-sm text-slate-400 pr-2 flex items-center justify-end">
                {hour}:00
              </div>

              {DAYS.map((_, dayIdx) => {
                const cell = cellMap.get(`${dayIdx}-${hour}`);
                const count = cell?.count ?? 0;
                const rooms = cell?.rooms ?? [];
                const bg = cellBackground(count, maxCount);
                const textColor = cellTextColor(count, maxCount);

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className="rounded-md h-8 flex items-center justify-center text-sm font-medium cursor-default transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400 select-none"
                    style={{ backgroundColor: bg, color: textColor }}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      if (!containerRect) return;
                      setTooltip({
                        day: dayIdx,
                        hour,
                        count,
                        rooms,
                        x: rect.left - containerRect.left + rect.width / 2,
                        y: rect.top - containerRect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {count > 0 ? count : ""}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
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
              {DAYS[tooltip.day]} {tooltip.hour}:00–{tooltip.hour + 1}:00
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
