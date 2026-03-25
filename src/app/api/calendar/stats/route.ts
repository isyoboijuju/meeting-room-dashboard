import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { computeRoomStats, computeHeatmap } from "@/lib/stats";
import { toLocalISO, countWeekdays } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const weekOf = searchParams.get("weekOf");

  let rangeStart: Date;
  let rangeEnd: Date;

  if (startDateParam && endDateParam) {
    rangeStart = new Date(`${startDateParam}T00:00:00+09:00`);
    rangeEnd = new Date(`${endDateParam}T00:00:00+09:00`);
    // Set rangeEnd to end of day (next day midnight for exclusive upper bound)
    rangeEnd.setDate(rangeEnd.getDate() + 1);
  } else {
    // Legacy weekOf mode
    const weekOfStr = weekOf || new Date().toISOString().split("T")[0];
    rangeStart = new Date(`${weekOfStr}T00:00:00+09:00`);
    const dayOfWeek = (rangeStart.getDay() + 6) % 7;
    rangeStart.setDate(rangeStart.getDate() - dayOfWeek);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 5);
  }

  // inclusive end for weekday counting (rangeEnd is exclusive upper bound)
  const inclusiveEnd = new Date(rangeEnd.getTime() - 86400000);
  const weekdays = Math.max(countWeekdays(rangeStart, inclusiveEnd), 1);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    rangeStart.toISOString(),
    rangeEnd.toISOString()
  );

  const metaStart = startDateParam || toLocalISO(rangeStart);
  const metaEnd = endDateParam || toLocalISO(inclusiveEnd);

  return NextResponse.json({
    rooms: computeRoomStats(events, weekdays),
    heatmap: computeHeatmap(events),
    meta: {
      startDate: metaStart,
      endDate: metaEnd,
      weekdays,
      weeks: Math.max(1, Math.round(weekdays / 5)),
    },
  });
}
