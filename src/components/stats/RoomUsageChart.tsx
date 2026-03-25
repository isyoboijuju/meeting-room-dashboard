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
  if (pct >= 80) return "#EF4444";
  if (pct >= 50) return "#C4A882";
  return "#4ADE80";
}

type TooltipPayloadItem = {
  value: number;
  payload: { name: string; occupancy: number };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, occupancy } = payload[0].payload;
  return (
    <div className="bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium">{name}</p>
      <p className="text-neutral-300">{occupancy}% occupancy</p>
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
    <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <h3 className="text-sm font-semibold text-neutral-700 mb-4">Room Occupancy</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#A3A3A3" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={72}
            tick={{ fontSize: 11, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F5F5" }} />
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
      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          &lt;50%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#C4A882" }} />
          50–80%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          80%+
        </span>
      </div>
    </div>
  );
}
