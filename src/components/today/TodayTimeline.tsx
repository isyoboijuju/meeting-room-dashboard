"use client";

import { useRef, useState } from "react";
import { CalendarEvent, MeetingRoom } from "@/lib/types";

const HOUR_START = 9;
const HOUR_END = 19;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const ROOM_COLORS: Record<string, string> = {
  B1F_GENESIS: "bg-blue-400",
  B1F_CONSENSUS: "bg-purple-400",
  B1F_BEACON: "bg-teal-400",
  B1F_HARD_FORK: "bg-orange-400",
  "2F_MERKLE": "bg-pink-400",
  "1F_NONCE": "bg-indigo-400",
  B1F_LOUNGE: "bg-gray-400",
};

const ROOM_COLORS_HEX: Record<string, string> = {
  B1F_GENESIS: "#60a5fa",
  B1F_CONSENSUS: "#c084fc",
  B1F_BEACON: "#2dd4bf",
  B1F_HARD_FORK: "#fb923c",
  "2F_MERKLE": "#f472b6",
  "1F_NONCE": "#818cf8",
  B1F_LOUNGE: "#9ca3af",
};

function timeToPercent(isoString: string): number {
  const d = new Date(isoString);
  const hours = d.getHours() + d.getMinutes() / 60;
  const clamped = Math.max(HOUR_START, Math.min(HOUR_END, hours));
  return ((clamped - HOUR_START) / TOTAL_HOURS) * 100;
}

function currentTimePercent(now: Date): number | null {
  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours < HOUR_START || hours > HOUR_END) return null;
  return ((hours - HOUR_START) / TOTAL_HOURS) * 100;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type TooltipState = {
  x: number;
  y: number;
  event: CalendarEvent;
} | null;

type Props = {
  rooms: MeetingRoom[];
  events: CalendarEvent[];
  now: Date;
};

export default function TodayTimeline({ rooms, events, now }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPct = currentTimePercent(now);

  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 overflow-x-auto">
      <h2 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wider">
        Room Timeline
      </h2>

      <div ref={containerRef} className="relative min-w-[600px]">
        {/* Hour grid labels */}
        <div className="flex mb-2 ml-28">
          {hourLabels.map((hour) => (
            <div
              key={hour}
              className="flex-1 text-xs text-neutral-400 text-center"
              style={{ minWidth: 0 }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rooms.map((room) => {
            const roomEvents = events.filter((e) => e.roomId === room.id);
            const color = ROOM_COLORS_HEX[room.id] ?? "#9ca3af";

            return (
              <div key={room.id} className="flex items-center gap-0">
                {/* Room label */}
                <div className="w-28 shrink-0 pr-3 text-right">
                  <span className="text-xs font-medium text-neutral-700">{room.name}</span>
                  <span className="block text-xs text-neutral-400">{room.floor}</span>
                </div>

                {/* Timeline bar */}
                <div className="relative flex-1 h-8 bg-neutral-100 rounded-md overflow-hidden">
                  {/* Vertical grid lines */}
                  {hourLabels.slice(1, -1).map((hour) => {
                    const pct = ((hour - HOUR_START) / TOTAL_HOURS) * 100;
                    return (
                      <div
                        key={hour}
                        className="absolute top-0 bottom-0 w-px bg-neutral-200"
                        style={{ left: `${pct}%` }}
                      />
                    );
                  })}

                  {/* Event blocks */}
                  {roomEvents.map((event) => {
                    const left = timeToPercent(event.start);
                    const right = timeToPercent(event.end);
                    const width = Math.max(0, right - left);

                    return (
                      <div
                        key={event.id}
                        className="absolute top-1 bottom-1 rounded cursor-pointer transition-opacity duration-200 hover:opacity-80"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: color,
                        }}
                        onMouseEnter={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setTooltip({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            event,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}

                  {/* Current time indicator (per row) */}
                  {currentPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                      style={{ left: `${currentPct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px]"
            style={{
              left: Math.min(tooltip.x + 12, (containerRef.current?.offsetWidth ?? 400) - 220),
              top: tooltip.y - 8,
              transform: "translateY(-100%)",
            }}
          >
            <p className="font-semibold leading-snug">{tooltip.event.title}</p>
            <p className="text-neutral-400 mt-0.5">
              {formatTime(tooltip.event.start)} – {formatTime(tooltip.event.end)}
            </p>
            {tooltip.event.organizer && (
              <p className="text-neutral-400 truncate">{tooltip.event.organizer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
