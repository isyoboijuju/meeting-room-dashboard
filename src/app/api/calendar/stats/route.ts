import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { computeRoomStats, computeHeatmap } from "@/lib/stats";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekOf = searchParams.get("weekOf") || new Date().toISOString().split("T")[0];

  const monday = new Date(`${weekOf}T00:00:00+09:00`);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 5);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    monday.toISOString(),
    friday.toISOString()
  );

  return NextResponse.json({
    rooms: computeRoomStats(events),
    heatmap: computeHeatmap(events),
  });
}
