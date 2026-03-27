"use client";

import { useState, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { MEETING_ROOMS, getRoomById } from "@/lib/rooms";
import type { CalendarEvent } from "@/lib/types";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export default function ReservationTable() {
  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalDateString(new Date())
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("all");

  const { events, loading, error } = useCalendarEvents(selectedDate, "day");

  const filtered = useMemo<CalendarEvent[]>(() => {
    const base =
      selectedRoom === "all"
        ? events
        : events.filter((e) => e.roomId === selectedRoom);

    return [...base].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [events, selectedRoom]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-200"
        />
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-200"
        >
          <option value="all">전체 회의실</option>
          {MEETING_ROOMS.map((room) => (
            <option key={room.id} value={room.id}>
              {room.floor} · {room.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            예약을 불러오는 중...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-400 text-sm">
            예약을 불러오지 못했습니다: {error}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-medium">시간</th>
                <th className="px-4 py-3 font-medium">회의실</th>
                <th className="px-4 py-3 font-medium">회의 제목</th>
                <th className="px-4 py-3 font-medium">주최자</th>
                <th className="px-4 py-3 font-medium">참석자</th>
                <th className="px-4 py-3 font-medium">소요 시간</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    해당 날짜에 예약이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((event) => {
                  const room = getRoomById(event.roomId);
                  const duration = getDurationMinutes(event.start, event.end);
                  return (
                    <tr
                      key={event.id}
                      className="transition-colors duration-200 hover:bg-slate-50 cursor-default"
                    >
                      <td className="px-4 py-3 text-slate-700 font-mono tabular-nums whitespace-nowrap">
                        {formatTime(event.start)}–{formatTime(event.end)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {room ? (
                          <span>
                            <span className="text-slate-400 text-xs mr-1">
                              {room.floor}
                            </span>
                            {room.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">{event.roomId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {event.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.organizer}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.attendees.length > 0 ? (
                          <span title={event.attendees.join(", ")}>
                            {event.attendees.slice(0, 3).join(", ")}
                            {event.attendees.length > 3 && (
                              <span className="text-slate-400 ml-1">
                                +{event.attendees.length - 3}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        {duration}분
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
