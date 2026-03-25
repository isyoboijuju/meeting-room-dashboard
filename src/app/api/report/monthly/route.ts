import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { computeRoomStats, computeHeatmap } from "@/lib/stats";
import { MEETING_ROOMS } from "@/lib/rooms";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const startDate = new Date(`${month}-01T00:00:00+09:00`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Count weekdays in the month for accurate occupancy calculation
  let monthWeekdays = 0;
  const d = new Date(startDate);
  while (d < endDate) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) monthWeekdays++;
    d.setDate(d.getDate() + 1);
  }

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    startDate.toISOString(),
    endDate.toISOString()
  );

  const stats = computeRoomStats(events, monthWeekdays);
  const heatmap = computeHeatmap(events);
  const totalBookings = events.length;
  const avgDuration = events.length > 0
    ? Math.round(events.reduce((sum, e) => {
        return sum + (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000;
      }, 0) / events.length)
    : 0;

  return NextResponse.json({
    month,
    totalBookings,
    avgDuration,
    rooms: stats.map((s) => ({
      ...s,
      name: MEETING_ROOMS.find((r) => r.id === s.roomId)?.name || s.roomId,
    })),
    heatmap,
  });
}
