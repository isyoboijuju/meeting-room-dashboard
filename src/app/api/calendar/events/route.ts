import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const range = searchParams.get("range") || "day";

  const startDate = new Date(`${date}T00:00:00+09:00`);
  let endDate: Date;

  if (range === "week") {
    const dayOfWeek = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);
    endDate = new Date(startDate);
    // Saturday 00:00 (exclusive upper bound for Google Calendar API)
    endDate.setDate(endDate.getDate() + 5);
  } else {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
  }

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    startDate.toISOString(),
    endDate.toISOString()
  );

  return NextResponse.json(events);
}
