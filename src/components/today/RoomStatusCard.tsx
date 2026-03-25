"use client";

import { CalendarEvent, MeetingRoom } from "@/lib/types";

type RoomStatus =
  | { kind: "available" }
  | { kind: "in-use"; event: CalendarEvent; progressPct: number; remainingMin: number }
  | { kind: "upcoming"; event: CalendarEvent; startsInMin: number };

function getRoomStatus(room: MeetingRoom, events: CalendarEvent[], now: Date): RoomStatus {
  const todayEvents = events.filter((e) => e.roomId === room.id);

  for (const event of todayEvents) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    if (now >= start && now < end) {
      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = now.getTime() - start.getTime();
      const progressPct = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
      const remainingMin = Math.ceil((end.getTime() - now.getTime()) / 60000);
      return { kind: "in-use", event, progressPct, remainingMin };
    }

    const startsInMs = start.getTime() - now.getTime();
    const startsInMin = Math.ceil(startsInMs / 60000);
    if (startsInMin > 0 && startsInMin <= 30) {
      return { kind: "upcoming", event, startsInMin };
    }
  }

  return { kind: "available" };
}

type Props = {
  room: MeetingRoom;
  events: CalendarEvent[];
  now: Date;
};

export default function RoomStatusCard({ room, events, now }: Props) {
  const status = getRoomStatus(room, events, now);

  const statusConfig = {
    available: {
      label: "Available",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
      badge: "bg-emerald-50 text-emerald-700",
    },
    "in-use": {
      label: "In Use",
      dot: "bg-rose-500",
      border: "border-rose-200",
      badge: "bg-rose-50 text-rose-700",
    },
    upcoming: {
      label: "Upcoming",
      dot: "bg-amber-500",
      border: "border-amber-200",
      badge: "bg-amber-50 text-amber-700",
    },
  };

  const config = statusConfig[status.kind];

  return (
    <div
      className={`
        bg-white rounded-xl border ${config.border}
        p-4 flex flex-col gap-3
        shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-300 ease-out
        cursor-default
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{room.floor}</p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{room.name}</h3>
        </div>
        <span
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${config.badge}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Capacity: <span className="font-medium text-slate-600">{room.capacity}</span>
      </p>

      {status.kind === "in-use" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 truncate font-medium" title={status.event.title}>
            {status.event.title}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${status.progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {status.remainingMin} min remaining
          </p>
        </div>
      )}

      {status.kind === "upcoming" && (
        <div className="space-y-1">
          <p className="text-xs text-slate-600 truncate font-medium" title={status.event.title}>
            {status.event.title}
          </p>
          <p className="text-xs font-medium text-amber-600">
            Starts in {status.startsInMin} min
          </p>
        </div>
      )}

      {status.kind === "available" && (
        <p className="text-xs text-emerald-600 font-medium">Ready to book</p>
      )}
    </div>
  );
}
