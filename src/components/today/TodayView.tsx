"use client";

import { useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { MEETING_ROOMS } from "@/lib/rooms";
import RoomStatusCard from "./RoomStatusCard";
import TodayTimeline from "./TodayTimeline";

export default function TodayView() {
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => now.toISOString().split("T")[0], [now]);

  const { events, loading, error } = useCalendarEvents(today, "day");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-400 text-sm">Loading today&apos;s schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-400 text-sm">Failed to load events: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <p className="text-sm text-neutral-400 mt-0.5">
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
      </div>

      {/* Room status cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {MEETING_ROOMS.map((room) => (
          <RoomStatusCard key={room.id} room={room} events={events} now={now} />
        ))}
      </div>

      {/* Timeline */}
      <TodayTimeline rooms={MEETING_ROOMS} events={events} now={now} />
    </div>
  );
}
