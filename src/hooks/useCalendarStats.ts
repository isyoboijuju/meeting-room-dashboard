"use client";

import { useState, useEffect } from "react";
import { RoomStats, HeatmapCell } from "@/lib/types";

type StatsData = {
  rooms: RoomStats[];
  heatmap: HeatmapCell[];
};

export function useCalendarStats(weekOf: string) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/calendar/stats?weekOf=${weekOf}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [weekOf]);

  return { data, loading, error };
}
