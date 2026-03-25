"use client";

import React, { useState } from "react";
import { HeatmapCell } from "@/lib/types";

type Props = {
  cells: HeatmapCell[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9..18

function cellBackground(count: number, maxCount: number): string {
  if (count === 0) return "#F5F5F4";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  // Interpolate from light wood (#D4B896) to dark wood (#8B7355)
  const r = Math.round(212 + (139 - 212) * intensity);
  const g = Math.round(184 + (115 - 184) * intensity);
  const b = Math.round(150 + (85 - 150) * intensity);
  return `rgb(${r},${g},${b})`;
}

function cellTextColor(count: number, maxCount: number): string {
  if (count === 0) return "#A8A29E";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  return intensity > 0.5 ? "#FAFAFA" : "#3F3026";
}

type TooltipState = {
  day: number;
  hour: number;
  count: number;
  rooms: string[];
  x: number;
  y: number;
} | null;

export default function WeeklyHeatmap({ cells }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  const cellMap = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell);
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 relative">
      <h3 className="text-sm font-semibold text-neutral-700 mb-4">
        Weekly Booking Heatmap
      </h3>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "48px repeat(5, 1fr)",
            gridTemplateRows: `24px repeat(${HOURS.length}, 1fr)`,
            gap: "3px",
            minWidth: "320px",
          }}
        >
          {/* Top-left empty corner */}
          <div />

          {/* Day headers */}
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-neutral-500 flex items-center justify-center"
            >
              {day}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div className="text-right text-xs text-neutral-400 pr-2 flex items-center justify-end">
                {hour}:00
              </div>

              {/* Day cells for this hour */}
              {DAYS.map((_, dayIdx) => {
                const cell = cellMap.get(`${dayIdx}-${hour}`);
                const count = cell?.count ?? 0;
                const rooms = cell?.rooms ?? [];
                const bg = cellBackground(count, maxCount);
                const textColor = cellTextColor(count, maxCount);

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className="rounded-md h-8 flex items-center justify-center text-xs font-medium cursor-default transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-stone-400 select-none"
                    style={{ backgroundColor: bg, color: textColor }}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        day: dayIdx,
                        hour,
                        count,
                        rooms,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
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
      <div className="flex items-center gap-2 mt-4 text-xs text-neutral-400">
        <span>Low</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background: "linear-gradient(to right, #D4B896, #8B7355)",
          }}
        />
        <span>High</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
        >
          <div className="bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-[200px]">
            <p className="font-semibold mb-1">
              {DAYS[tooltip.day]} {tooltip.hour}:00–{tooltip.hour + 1}:00
            </p>
            <p className="text-neutral-300">
              {tooltip.count} booking{tooltip.count !== 1 ? "s" : ""}
            </p>
            {tooltip.rooms.length > 0 && (
              <p className="text-neutral-400 mt-1 leading-relaxed">
                {tooltip.rooms.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
