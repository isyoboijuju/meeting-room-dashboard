import { google } from "googleapis";
import { CalendarEvent } from "./types";
import { parseRoomFromEvent } from "./rooms";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const TIMEZONE = "Asia/Seoul";

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const allItems: any[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      pageToken,
    });
    allItems.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return allItems
    .map((event) => {
      const roomId = parseRoomFromEvent({
        location: event.location ?? undefined,
        attendees: event.attendees?.map((a: any) => ({
          email: a.email ?? "",
          resource: a.resource ?? false,
        })),
      });

      if (!roomId) return null;

      const attendees = (event.attendees ?? [])
        .filter((a: any) => !a.resource && !a.self)
        .map((a: any) => a.displayName ?? a.email ?? "")
        .filter(Boolean);

      return {
        id: event.id ?? "",
        title: event.summary ?? "Untitled",
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        roomId,
        organizer: event.creator?.displayName ?? event.creator?.email ?? "",
        attendees,
      };
    })
    .filter((e): e is CalendarEvent => e !== null);
}
