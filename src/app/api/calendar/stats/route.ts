import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { computeRoomStats, computeHeatmap } from "@/lib/stats";
import { toLocalISO, countWeekdays } from "@/lib/date-utils";

// Parse "YYYY-MM-DD" into a Date at server-local midnight.
// Avoids UTC offset bugs when getDay()/getDate() are called on +09:00 Dates.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toKSTISO(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00+09:00`).toISOString();
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const weekOf = searchParams.get("weekOf");

  let startStr: string;
  let endExclusiveStr: string;

  if (startDateParam && endDateParam) {
    startStr = startDateParam;
    const endDate = parseLocalDate(endDateParam);
    endDate.setDate(endDate.getDate() + 1);
    endExclusiveStr = toLocalISO(endDate);
  } else {
    const weekOfStr = weekOf || toLocalISO(new Date());
    const ref = parseLocalDate(weekOfStr);
    const dow = (ref.getDay() + 6) % 7; // 0=Mon
    ref.setDate(ref.getDate() - dow);
    const saturday = new Date(ref);
    saturday.setDate(ref.getDate() + 5);
    startStr = toLocalISO(ref);
    endExclusiveStr = toLocalISO(saturday);
  }

  const endInclDate = parseLocalDate(endExclusiveStr);
  endInclDate.setDate(endInclDate.getDate() - 1);
  const endInclusiveStr = toLocalISO(endInclDate);

  const weekdays = Math.max(countWeekdays(parseLocalDate(startStr), endInclDate), 1);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    toKSTISO(startStr),
    toKSTISO(endExclusiveStr)
  );

  return NextResponse.json({
    rooms: computeRoomStats(events, weekdays),
    heatmap: computeHeatmap(events),
    meta: {
      startDate: startStr,
      endDate: endInclusiveStr,
      weekdays,
      weeks: Math.max(1, Math.round(weekdays / 5)),
    },
  });
}
