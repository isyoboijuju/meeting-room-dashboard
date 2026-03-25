import { MeetingRoom } from "./types";

export const MEETING_ROOMS: MeetingRoom[] = [
  { id: "B1F_GENESIS", name: "GENESIS", floor: "B1F", capacity: 12, alias: "Meeting Room 1" },
  { id: "B1F_CONSENSUS", name: "CONSENSUS", floor: "B1F", capacity: 6, alias: "Meeting Room 2" },
  { id: "B1F_BEACON", name: "BEACON", floor: "B1F", capacity: 12, alias: "Meeting Room 3" },
  { id: "B1F_HARD_FORK", name: "HARD FORK", floor: "B1F", capacity: 6, alias: "Meeting Room 4" },
  { id: "2F_MERKLE", name: "MERKLE", floor: "2F", capacity: 6, alias: "Meeting Room 2" },
  { id: "1F_NONCE", name: "NONCE", floor: "1F", capacity: 6, alias: "Meeting Room 2" },
  { id: "B1F_LOUNGE", name: "Lounge", floor: "B1F", capacity: 30, alias: "Lounge" },
];

export function parseRoomFromEvent(event: {
  location?: string;
  attendees?: Array<{ email: string; resource?: boolean }>;
}): string | null {
  if (event.attendees) {
    const resource = event.attendees.find(
      (a) => a.resource && a.email.includes("resource.calendar.google.com")
    );
    if (resource) {
      const match = MEETING_ROOMS.find((room) =>
        resource.email.toLowerCase().includes(room.name.toLowerCase())
      );
      if (match) return match.id;
    }
  }

  if (event.location) {
    const loc = event.location.toUpperCase();
    const match = MEETING_ROOMS.find(
      (room) =>
        loc.includes(room.id.toUpperCase()) ||
        loc.includes(room.name.toUpperCase())
    );
    if (match) return match.id;
  }

  return null;
}

export function getRoomById(id: string): MeetingRoom | undefined {
  return MEETING_ROOMS.find((room) => room.id === id);
}
