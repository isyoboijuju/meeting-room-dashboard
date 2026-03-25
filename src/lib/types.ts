export type MeetingRoom = {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  alias: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  roomId: string;
  organizer: string;
};

export type RoomStats = {
  roomId: string;
  weeklyOccupancy: number;
  totalBookings: number;
  avgDurationMinutes: number;
};

export type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
  rooms: string[];
};

export type StatsMeta = {
  startDate: string;
  endDate: string;
  weekdays: number;
  weeks: number;
};
