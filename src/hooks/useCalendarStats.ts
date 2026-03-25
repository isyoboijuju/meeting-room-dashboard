"use client";

import { useState, useEffect } from "react";
import { RoomStats, HeatmapCell, StatsMeta } from "@/lib/types";
import { getMonthRange } from "@/lib/date-utils";

export type StatsQuery =
  | { mode: "week"; weekOf: string }
  | { mode: "month"; month: string }
  | { mode: "custom"; startDate: string; endDate: string };

export type StatsData = {
  rooms: RoomStats[];
  heatmap: HeatmapCell[];
  meta?: StatsMeta;
};

function buildURL(query: StatsQuery): string {
  const base = "/api/calendar/stats";
  switch (query.mode) {
    case "week":
      return `${base}?weekOf=${query.weekOf}`;
    case "month": {
      const { start, end } = getMonthRange(query.month);
      return `${base}?startDate=${start}&endDate=${end}`;
    }
    case "custom":
      return `${base}?startDate=${query.startDate}&endDate=${query.endDate}`;
  }
}

function queryKey(query: StatsQuery): string {
  switch (query.mode) {
    case "week":
      return `week:${query.weekOf}`;
    case "month":
      return `month:${query.month}`;
    case "custom":
      return `custom:${query.startDate}:${query.endDate}`;
  }
}

export function useCalendarStats(query: StatsQuery) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = queryKey(query);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(buildURL(query))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error };
}
