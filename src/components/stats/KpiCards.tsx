"use client";

import { RoomStats } from "@/lib/types";

type Props = {
  rooms: RoomStats[];
};

export default function KpiCards({ rooms }: Props) {
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
      label: "Total Bookings",
      value: totalBookings.toString(),
      sub: "this week",
    },
    {
      label: "Avg Duration",
      value: avgDurationLabel,
      sub: "per booking",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col gap-1 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default"
        >
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            {card.label}
          </span>
          <span className="text-3xl font-bold text-neutral-900">{card.value}</span>
          <span className="text-xs text-neutral-400">{card.sub}</span>
        </div>
      ))}
    </div>
  );
}
