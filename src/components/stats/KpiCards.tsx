"use client";

import { RoomStats } from "@/lib/types";

type Props = {
  rooms: RoomStats[];
  periodLabel?: string;
};

export default function KpiCards({ rooms, periodLabel = "이번 주" }: Props) {
  const totalBookings = rooms.reduce((sum, r) => sum + r.totalBookings, 0);

  const totalMinutes = rooms.reduce(
    (sum, r) => sum + r.totalBookings * r.avgDurationMinutes,
    0
  );
  const avgDurationMinutes =
    totalBookings > 0 ? Math.round(totalMinutes / totalBookings) : 0;
  const avgDurationHours = Math.floor(avgDurationMinutes / 60);
  const avgDurationRemainder = avgDurationMinutes % 60;
  const avgDurationLabel =
    avgDurationHours > 0
      ? `${avgDurationHours}h ${avgDurationRemainder}m`
      : `${avgDurationMinutes}m`;

  const cards = [
    {
      label: "총 예약 수",
      value: totalBookings.toString(),
      sub: periodLabel,
    },
    {
      label: "평균 시간",
      value: avgDurationLabel,
      sub: "예약 당",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col gap-1 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-default"
        >
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {card.label}
          </span>
          <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {card.value}
          </span>
          <span className="text-sm text-slate-400">{card.sub}</span>
        </div>
      ))}
    </div>
  );
}
