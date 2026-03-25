import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { MEETING_ROOMS } from "@/lib/rooms";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const capacity = parseInt(searchParams.get("capacity") || "1", 10);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const time = searchParams.get("time") || "09:00";

  const targetStart = new Date(`${date}T${time}:00+09:00`);
  const dayEnd = new Date(`${date}T19:00:00+09:00`);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    targetStart.toISOString(),
    dayEnd.toISOString()
  );

  const available = MEETING_ROOMS
    .filter((room) => room.capacity >= capacity)
    .map((room) => {
      const roomEvents = events
        .filter((e) => e.roomId === room.id)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      const conflicting = roomEvents.find(
        (e) => new Date(e.start) <= targetStart && new Date(e.end) > targetStart
      );
      if (conflicting) return null;

      const nextBooking = roomEvents.find((e) => new Date(e.start) > targetStart);
      const availableUntil = nextBooking
        ? new Date(nextBooking.start).toISOString()
        : dayEnd.toISOString();

      return { ...room, availableUntil };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.capacity - b.capacity);

  return NextResponse.json(available);
}
