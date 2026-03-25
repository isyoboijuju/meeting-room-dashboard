"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "@/lib/types";

export function useCalendarEvents(date: string, range: "day" | "week" = "day") {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/calendar/events?date=${date}&range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, range]);

  return { events, loading, error };
}
