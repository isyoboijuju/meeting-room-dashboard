"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RoomStats } from "@/lib/types";
import { getRoomById } from "@/lib/rooms";

type Props = {
  rooms: RoomStats[];
};

function occupancyColor(pct: number): string {
  if (pct >= 30) return "#F43F5E"; // rose-500
  if (pct >= 15) return "#F59E0B"; // amber-500
  return "#10B981"; // emerald-500
}

type TooltipPayloadItem = {
  value: number;
  payload: { name: string; occupancy: number; bookings: number };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, occupancy, bookings } = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{name}</p>
      <p className="text-slate-300">{occupancy}% 사용률 · {bookings}건</p>
    </div>
  );
}

export default function RoomUsageChart({ rooms }: Props) {
  const sorted = [...rooms]
    .map((r) => {
      const room = getRoomById(r.roomId);
      return {
        name: room?.name ?? r.roomId,
        occupancy: r.weeklyOccupancy,
        bookings: r.totalBookings,
      };
    })
    .sort((a, b) => b.occupancy - a.occupancy);

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out">
      <h3 className="text-base font-semibold text-slate-700 mb-3">회의실 사용률</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, (max: number) => Math.ceil(max / 10) * 10 || 40]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
          <Bar dataKey="occupancy" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {sorted.map((entry) => (
              <Cell
                key={entry.name}
                fill={occupancyColor(entry.occupancy)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          &lt;15%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          15–30%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          30%+
        </span>
      </div>
    </div>
  );
}
