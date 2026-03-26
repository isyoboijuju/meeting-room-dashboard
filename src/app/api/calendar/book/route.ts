import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/lib/auth';
import { fetchCalendarEvents } from '@/lib/calendar';
import { getRoomById } from '@/lib/rooms';

type BookRequestBody = {
  roomId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function invalidInput(message: string) {
  return NextResponse.json({ error: 'INVALID_INPUT', message }, { status: 400 });
}

function conflict(message: string) {
  return NextResponse.json({ error: 'CONFLICT', message }, { status: 409 });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDateString(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidTimeString(time: string): boolean {
  if (!TIME_PATTERN.test(time)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function currentKSTDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function findOverlappingRoomEvents(
  events: Array<{ roomId: string; start: string; end: string }>,
  roomId: string,
  requestedStart: Date,
  requestedEnd: Date
) {
  return events.filter((event) => {
    if (event.roomId !== roomId) return false;

    const existingStart = new Date(event.start);
    const existingEnd = new Date(event.end);

    return existingStart < requestedEnd && existingEnd > requestedStart;
  });
}

function isGooglePermissionError(error: unknown): boolean {
  if (!isObject(error)) return false;

  const code = typeof error.code === 'number' ? error.code : undefined;
  if (code === 403) return true;

  if (!isObject(error.response)) return false;
  return error.response.status === 403;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || !(session as any).accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const accessToken = (session as unknown as { accessToken: string }).accessToken;

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return invalidInput('요청 본문이 올바르지 않습니다.');
  }

  if (!isObject(payload)) {
    return invalidInput('요청 본문이 올바르지 않습니다.');
  }

  const body: BookRequestBody = {
    roomId: typeof payload.roomId === 'string' ? payload.roomId.trim() : '',
    title: typeof payload.title === 'string' ? payload.title.trim() : '',
    date: typeof payload.date === 'string' ? payload.date : '',
    startTime: typeof payload.startTime === 'string' ? payload.startTime : '',
    endTime: typeof payload.endTime === 'string' ? payload.endTime : '',
  };

  if (!body.roomId || !body.title || !body.date || !body.startTime || !body.endTime) {
    return invalidInput('모든 필드를 입력해 주세요.');
  }

  if (!isValidDateString(body.date)) {
    return invalidInput('날짜 형식이 올바르지 않습니다.');
  }

  if (!isValidTimeString(body.startTime) || !isValidTimeString(body.endTime)) {
    return invalidInput('시간 형식이 올바르지 않습니다.');
  }

  if (body.endTime <= body.startTime) {
    return invalidInput('종료 시간은 시작 시간 이후여야 합니다.');
  }

  if (body.date < currentKSTDateString()) {
    return invalidInput('지난 날짜는 예약할 수 없습니다.');
  }

  const room = getRoomById(body.roomId);
  if (!room) {
    return invalidInput('유효하지 않은 회의실입니다.');
  }

  const requestedStart = new Date(`${body.date}T${body.startTime}:00+09:00`);
  const requestedEnd = new Date(`${body.date}T${body.endTime}:00+09:00`);

  if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime())) {
    return invalidInput('예약 시간이 올바르지 않습니다.');
  }

  const startISO = requestedStart.toISOString();
  const endISO = requestedEnd.toISOString();

  try {
    const existingEvents = await fetchCalendarEvents(
      accessToken,
      startISO,
      endISO
    );

    const overlappingEvents = findOverlappingRoomEvents(
      existingEvents,
      body.roomId,
      requestedStart,
      requestedEnd
    );

    if (overlappingEvents.length > 0) {
      return conflict('해당 시간에 이미 예약된 회의가 있습니다.');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const insertResponse = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      sendUpdates: 'none',
      requestBody: {
        summary: body.title,
        location: room.name,
        start: { dateTime: startISO, timeZone: 'Asia/Seoul' },
        end: { dateTime: endISO, timeZone: 'Asia/Seoul' },
        extendedProperties: { private: { source: 'meeting-room-dashboard' } },
      },
    });

    const eventId = insertResponse.data.id;
    if (!eventId) {
      throw new Error('Created calendar event is missing an id.');
    }

    const postInsertEvents = await fetchCalendarEvents(
      accessToken,
      startISO,
      endISO
    );

    const postInsertOverlaps = findOverlappingRoomEvents(
      postInsertEvents,
      body.roomId,
      requestedStart,
      requestedEnd
    );

    if (postInsertOverlaps.length > 1) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId,
          sendUpdates: 'none',
        });
      } catch (cleanupError) {
        console.error('Failed to rollback conflicting booking:', cleanupError);
      }

      return conflict('해당 시간에 이미 예약된 회의가 있습니다.');
    }

    return NextResponse.json({ success: true, eventId }, { status: 201 });
  } catch (error) {
    if (isGooglePermissionError(error)) {
      return NextResponse.json(
        { error: 'REAUTH_REQUIRED', message: '권한이 부족합니다. 다시 로그인해 주세요.' },
        { status: 401 }
      );
    }

    console.error('Failed to book meeting room:', error);

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '예약에 실패했습니다. 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
