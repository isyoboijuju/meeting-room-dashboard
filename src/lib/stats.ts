import { CalendarEvent, RoomStats, HeatmapCell } from "./types";
import { MEETING_ROOMS } from "./rooms";

const BUSINESS_START = 9;
const BUSINESS_END = 19;
const BUSINESS_HOURS = BUSINESS_END - BUSINESS_START;
const WEEKDAYS = 5;

// Parse ISO datetime string to extract hour/day in the string's own timezone offset.
// This avoids relying on runtime-local timezone (critical when server runs in UTC).
// Duration math uses new Date() separately — epoch diff is TZ-agnostic.
function parseISOLocal(iso: string): { hour: number; minute: number; dayOfWeek: number } {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    console.warn("parseISOLocal: unexpected format:", iso);
    return { hour: 0, minute: 0, dayOfWeek: 0 };
  }
  const [, y, m, d, h, min] = match.map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  return { hour: h, minute: Number(min), dayOfWeek: (dow + 6) % 7 };
}

export function computeRoomStats(events: CalendarEvent[], weekdays = WEEKDAYS): RoomStats[] {
  return MEETING_ROOMS.map((room) => {
    const roomEvents = events.filter((e) => e.roomId === room.id);
    const totalMinutes = roomEvents.reduce((sum, e) => {
      const start = new Date(e.start).getTime();
      const end = new Date(e.end).getTime();
      return sum + (end - start) / 60000;
    }, 0);

    const totalAvailableMinutes = BUSINESS_HOURS * 60 * weekdays;
    const occupancy = totalAvailableMinutes > 0
      ? Math.round((totalMinutes / totalAvailableMinutes) * 100)
      : 0;

    return {
      roomId: room.id,
      weeklyOccupancy: Math.min(occupancy, 100),
      totalBookings: roomEvents.length,
      avgDurationMinutes: roomEvents.length > 0
        ? Math.round(totalMinutes / roomEvents.length)
        : 0,
    };
  });
}

export function computeHeatmap(events: CalendarEvent[]): HeatmapCell[] {
  const grid: Record<string, { count: number; rooms: Set<string> }> = {};

  for (const event of events) {
    const start = parseISOLocal(event.start);
    const end = parseISOLocal(event.end);
    const day = start.dayOfWeek;
    if (day > 4) continue;

    // Floor start to nearest 30-min slot
    const startTotalMins = start.hour * 60 + Math.floor(start.minute / 30) * 30;
    // Ceil end to nearest 30-min slot
    const endRaw = end.hour * 60 + end.minute;
    const endTotalMins = end.minute % 30 === 0 ? endRaw : Math.ceil(endRaw / 30) * 30;

    const slotStart = Math.max(startTotalMins, BUSINESS_START * 60);
    const slotEnd = Math.min(endTotalMins, BUSINESS_END * 60);

    for (let mins = slotStart; mins < slotEnd; mins += 30) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const key = `${day}-${h}-${m}`;
      if (!grid[key]) grid[key] = { count: 0, rooms: new Set() };
      grid[key].count++;
      const roomName = MEETING_ROOMS.find((r) => r.id === event.roomId)?.name || event.roomId;
      grid[key].rooms.add(roomName);
    }
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < WEEKDAYS; day++) {
    for (let mins = BUSINESS_START * 60; mins <= BUSINESS_END * 60; mins += 30) {
      const hour = Math.floor(mins / 60);
      const minute = mins % 60;
      const entry = grid[`${day}-${hour}-${minute}`];
      cells.push({
        day,
        hour,
        minute,
        count: entry?.count || 0,
        rooms: entry ? Array.from(entry.rooms) : [],
      });
    }
  }

  return cells;
}
