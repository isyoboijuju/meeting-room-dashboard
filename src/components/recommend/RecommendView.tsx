"use client";

import { useState } from "react";
import { MeetingRoom } from "@/lib/types";

type RecommendResult = MeetingRoom & { availableUntil: string };

export default function RecommendView() {
  const [capacity, setCapacity] = useState<number>(2);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState<string>("09:00");
  const [results, setResults] = useState<RecommendResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        capacity: String(capacity),
        date,
        time,
      });
      const res = await fetch(`/api/calendar/recommend?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");
      const data: RecommendResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function formatAvailableUntil(iso: string): string {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200";

  const labelClass = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-base font-semibold text-slate-900">
          Find an Available Room
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="capacity" className={labelClass}>
              Attendees
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="time" className={labelClass}>
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className={
            "w-full sm:w-auto px-6 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 " +
            "hover:bg-indigo-700 transition-all duration-200 active:scale-[0.98] " +
            "disabled:opacity-60 disabled:cursor-not-allowed"
          }
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No rooms available for this time slot.
            </p>
          ) : (
            results.map((room) => (
              <div
                key={room.id}
                className={
                  "bg-white border border-slate-200/60 rounded-xl p-4 " +
                  "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {room.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {room.floor} &middot; Capacity {room.capacity}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Available until {formatAvailableUntil(room.availableUntil)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
