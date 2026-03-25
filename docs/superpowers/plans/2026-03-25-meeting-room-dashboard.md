# DSRV Meeting Room Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based dashboard that visualizes DSRV meeting room reservation data from Google Calendar, with stats/heatmap, today view, reservations table, and room recommendation.

**Architecture:** Next.js App Router with API Routes proxying Google Calendar API. next-auth handles Google OAuth; server-side API Routes fetch and transform calendar data; React client components render tabs with recharts and CSS grid.

**Tech Stack:** Next.js 14+, React 18, Tailwind CSS, next-auth v5, @googleapis/calendar, recharts, jsPDF + html2canvas

---

## File Structure

```
meeting-room-dashboard/
  src/
    app/
      layout.tsx                         ← root layout, auth provider, global styles
      page.tsx                           ← main dashboard page (tab container)
      api/
        auth/[...nextauth]/route.ts      ← next-auth Google OAuth handler
        calendar/events/route.ts         ← GET events by date/range
        calendar/stats/route.ts          ← GET computed stats + heatmap
        calendar/recommend/route.ts      ← GET room recommendations
        report/monthly/route.ts          ← GET PDF report
    components/
      layout/
        Header.tsx                       ← logo, user info, logout
        TabNavigation.tsx                ← tab switcher component
      stats/
        StatsView.tsx                    ← main tab: left-right split container
        KpiCards.tsx                     ← total bookings, avg duration cards
        RoomUsageChart.tsx               ← horizontal bar chart (recharts)
        WeeklyHeatmap.tsx                ← CSS grid heatmap
        WeekSelector.tsx                 ← week navigation arrows
      today/
        TodayView.tsx                    ← today tab container
        RoomStatusCard.tsx               ← single room status card
        TodayTimeline.tsx                ← Gantt-style timeline
      reservations/
        ReservationTable.tsx             ← filterable table
      recommend/
        RecommendView.tsx                ← room recommendation form + results
    lib/
      auth.ts                            ← next-auth config + token handling
      calendar.ts                        ← Google Calendar API client wrapper
      rooms.ts                           ← room master data + parsing logic
      stats.ts                           ← stats computation (occupancy, heatmap)
      types.ts                           ← shared TypeScript types
    hooks/
      useCalendarEvents.ts               ← SWR/fetch hook for events
      useCalendarStats.ts                ← SWR/fetch hook for stats
  .env.example                           ← env template
  tailwind.config.ts
  README.md                              ← setup instructions
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with `src/app/` structure, Tailwind configured.

- [ ] **Step 2: Create .env.example**

Create `.env.example`:
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CALENDAR_ID=c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com
```

- [ ] **Step 3: Update .gitignore**

Ensure `.gitignore` includes:
```
.env
.env.local
```

- [ ] **Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: localhost:3000 shows Next.js default page.

- [ ] **Step 5: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js project with Tailwind CSS"
```

---

### Task 2: Shared Types and Room Master Data

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/rooms.ts`

- [ ] **Step 1: Create shared types**

Create `src/lib/types.ts`:
```typescript
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
  rooms: string[];  // room names booked in this slot
};
```

- [ ] **Step 2: Create room master data and parsing logic**

Create `src/lib/rooms.ts`:
```typescript
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
  // Priority 1: resource attendee
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

  // Priority 2: location field
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/rooms.ts
git commit -m "feat: add shared types and room master data with parsing logic"
```

---

### Task 3: Google OAuth with next-auth

**Files:**
- Install: `next-auth@beta`, `@auth/core`
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/app/layout.tsx` (wrap with SessionProvider)

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install next-auth@beta @auth/core
```

- [ ] **Step 2: Create auth config**

Create `src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Return token if not expired (with 60s buffer)
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60000) {
        return token;
      }

      // Refresh the access token
      if (token.refreshToken) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });
          const refreshed = await response.json();
          if (!response.ok) throw new Error(refreshed.error);
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
        } catch (error) {
          console.error("Token refresh failed:", error);
          token.error = "RefreshTokenError";
        }
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },
});
```

- [ ] **Step 3: Create auth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Wrap layout with SessionProvider**

Modify `src/app/layout.tsx` — add SessionProvider at the top of the body:
```typescript
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure Google OAuth with next-auth v5"
```

---

### Task 4: Google Calendar API Client

**Files:**
- Install: `googleapis`
- Create: `src/lib/calendar.ts`

- [ ] **Step 1: Install googleapis**

Run:
```bash
npm install googleapis
```

- [ ] **Step 2: Create calendar client module**

Create `src/lib/calendar.ts`:
```typescript
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

  const events = allItems;

  return events
    .map((event) => {
      const roomId = parseRoomFromEvent({
        location: event.location ?? undefined,
        attendees: event.attendees?.map((a) => ({
          email: a.email ?? "",
          resource: a.resource ?? false,
        })),
      });

      if (!roomId) return null;

      return {
        id: event.id ?? "",
        title: event.summary ?? "Untitled",
        start: event.start?.dateTime ?? event.start?.date ?? "",
        end: event.end?.dateTime ?? event.end?.date ?? "",
        roomId,
        organizer: event.organizer?.email ?? "",
      };
    })
    .filter((e): e is CalendarEvent => e !== null);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/calendar.ts package.json package-lock.json
git commit -m "feat: add Google Calendar API client with room parsing"
```

---

### Task 5: Stats Computation Module

**Files:**
- Create: `src/lib/stats.ts`

- [ ] **Step 1: Create stats computation**

Create `src/lib/stats.ts`:
```typescript
import { CalendarEvent, RoomStats, HeatmapCell } from "./types";
import { MEETING_ROOMS } from "./rooms";

const BUSINESS_START = 9;
const BUSINESS_END = 19;
const BUSINESS_HOURS = BUSINESS_END - BUSINESS_START;
const WEEKDAYS = 5;

// Parse ISO datetime string to extract hour/day in the string's own timezone offset
// This avoids relying on runtime-local timezone (critical when server runs in UTC)
function parseISOLocal(iso: string): { hour: number; minute: number; dayOfWeek: number } {
  // Match: 2026-03-25T14:00:00+09:00
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { hour: 0, minute: 0, dayOfWeek: 0 };
  const [, y, m, d, h, min] = match.map(Number);
  // Compute day of week from date parts (Zeller-like via Date, but date-only so TZ is irrelevant)
  const date = new Date(y, m - 1, d);
  const dow = date.getDay(); // 0=Sun, 6=Sat
  return { hour: h, minute: Number(min), dayOfWeek: (dow + 6) % 7 }; // 0=Mon, 4=Fri
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
    if (day > 4) continue; // skip weekends

    // Count every hour the meeting spans, not just the start hour
    const startHour = Math.max(start.hour, BUSINESS_START);
    const endHour = Math.min(
      end.minute > 0 ? end.hour + 1 : end.hour,
      BUSINESS_END
    );

    for (let h = startHour; h < endHour; h++) {
      const key = `${day}-${h}`;
      if (!grid[key]) grid[key] = { count: 0, rooms: new Set() };
      grid[key].count++;
      const roomName = MEETING_ROOMS.find((r) => r.id === event.roomId)?.name || event.roomId;
    grid[key].rooms.add(roomName);
    }
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < WEEKDAYS; day++) {
    for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
      const entry = grid[`${day}-${hour}`];
      cells.push({
        day,
        hour,
        count: entry?.count || 0,
        rooms: entry ? Array.from(entry.rooms) : [],
      });
    }
  }

  return cells;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stats.ts
git commit -m "feat: add stats computation for occupancy and heatmap"
```

---

### Task 6: API Routes (Events, Stats, Recommend)

**Files:**
- Create: `src/app/api/calendar/events/route.ts`
- Create: `src/app/api/calendar/stats/route.ts`
- Create: `src/app/api/calendar/recommend/route.ts`

- [ ] **Step 1: Create events API route**

Create `src/app/api/calendar/events/route.ts`:
```typescript
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
```

- [ ] **Step 2: Create stats API route**

Create `src/app/api/calendar/stats/route.ts`:
```typescript
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
```

- [ ] **Step 3: Create recommend API route**

Create `src/app/api/calendar/recommend/route.ts`:
```typescript
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
  // Fetch all events for the rest of the day to calculate availability windows
  const dayEnd = new Date(`${date}T19:00:00+09:00`);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    targetStart.toISOString(),
    dayEnd.toISOString()
  );

  // For each room, find the next booking after targetStart
  const available = MEETING_ROOMS
    .filter((room) => room.capacity >= capacity)
    .map((room) => {
      const roomEvents = events
        .filter((e) => e.roomId === room.id)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      // Check if room is occupied at targetStart
      const conflicting = roomEvents.find(
        (e) => new Date(e.start) <= targetStart && new Date(e.end) > targetStart
      );
      if (conflicting) return null;

      // Find when room becomes unavailable (next booking or end of business)
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
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/calendar/
git commit -m "feat: add API routes for events, stats, and room recommendation"
```

---

### Task 7: Data Fetching Hooks

**Files:**
- Create: `src/hooks/useCalendarEvents.ts`
- Create: `src/hooks/useCalendarStats.ts`

- [ ] **Step 1: Create events hook**

Create `src/hooks/useCalendarEvents.ts`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "@/lib/types";

export function useCalendarEvents(date: string, range: "day" | "week" = "day") {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/calendar/events?date=${date}&range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, range]);

  return { events, loading, error };
}
```

- [ ] **Step 2: Create stats hook**

Create `src/hooks/useCalendarStats.ts`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { RoomStats, HeatmapCell } from "@/lib/types";

type StatsData = {
  rooms: RoomStats[];
  heatmap: HeatmapCell[];
};

export function useCalendarStats(weekOf: string) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/calendar/stats?weekOf=${weekOf}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [weekOf]);

  return { data, loading, error };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data fetching hooks for events and stats"
```

---

### Task 8: Layout Components (Header + TabNavigation)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/TabNavigation.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create Header component**

Create `src/components/layout/Header.tsx`:
```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
      <h1 className="text-xl font-bold text-gray-900">DSRV Meeting Room Dashboard</h1>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-sm text-gray-600">{session.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="text-sm px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create TabNavigation component**

Create `src/components/layout/TabNavigation.tsx`:
```typescript
"use client";

const TABS = [
  { id: "stats", label: "Stats / Heatmap" },
  { id: "today", label: "Today" },
  { id: "reservations", label: "Reservations" },
  { id: "recommend", label: "Recommend" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export default function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex border-b border-gray-200 bg-white px-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Wire up main page**

Modify `src/app/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/layout/Header";
import TabNavigation, { TabId } from "@/components/layout/TabNavigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {session ? (
        <>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="p-6">
            {activeTab === "stats" && <div>Stats/Heatmap (Task 9)</div>}
            {activeTab === "today" && <div>Today View (Task 10)</div>}
            {activeTab === "reservations" && <div>Reservations (Task 11)</div>}
            {activeTab === "recommend" && <div>Recommend (Task 12)</div>}
          </main>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500">Please sign in to view the dashboard.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify dev server renders layout**

Run: `npm run dev`
Expected: Header with sign-in button visible, tabs render after login.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/app/page.tsx
git commit -m "feat: add Header, TabNavigation, and main dashboard page shell"
```

---

### Task 9: Stats/Heatmap Tab (Main Tab)

**Files:**
- Create: `src/components/stats/StatsView.tsx`
- Create: `src/components/stats/KpiCards.tsx`
- Create: `src/components/stats/RoomUsageChart.tsx`
- Create: `src/components/stats/WeeklyHeatmap.tsx`
- Create: `src/components/stats/WeekSelector.tsx`
- Install: `recharts`

- [ ] **Step 1: Install recharts**

Run:
```bash
npm install recharts
```

- [ ] **Step 2: Create WeekSelector**

Create `src/components/stats/WeekSelector.tsx`:
```typescript
"use client";

type Props = {
  weekOf: string;
  onChange: (date: string) => void;
};

function getMonday(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00+09:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(monday)} ~ ${fmt(friday)}`;
}

export default function WeekSelector({ weekOf, onChange }: Props) {
  const monday = getMonday(weekOf);

  const prev = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    onChange(d.toISOString().split("T")[0]);
  };

  const next = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    onChange(d.toISOString().split("T")[0]);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600">&larr;</button>
      <span className="text-sm font-medium text-gray-700">{formatWeekLabel(monday)}</span>
      <button onClick={next} className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600">&rarr;</button>
    </div>
  );
}
```

- [ ] **Step 3: Create KpiCards**

Create `src/components/stats/KpiCards.tsx`:
```typescript
import { RoomStats } from "@/lib/types";

type Props = {
  rooms: RoomStats[];
};

export default function KpiCards({ rooms }: Props) {
  const totalBookings = rooms.reduce((sum, r) => sum + r.totalBookings, 0);
  const totalMinutes = rooms.reduce((sum, r) => sum + r.avgDurationMinutes * r.totalBookings, 0);
  const avgDuration = totalBookings > 0 ? Math.round(totalMinutes / totalBookings) : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Total Bookings</p>
        <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Avg Duration</p>
        <p className="text-2xl font-bold text-gray-900">{avgDuration}min</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create RoomUsageChart**

Create `src/components/stats/RoomUsageChart.tsx`:
```typescript
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { RoomStats } from "@/lib/types";
import { getRoomById } from "@/lib/rooms";

type Props = {
  rooms: RoomStats[];
};

function getBarColor(occupancy: number): string {
  if (occupancy >= 80) return "#ef4444";
  if (occupancy >= 50) return "#eab308";
  return "#22c55e";
}

export default function RoomUsageChart({ rooms }: Props) {
  const sorted = [...rooms].sort((a, b) => b.weeklyOccupancy - a.weeklyOccupancy);
  const data = sorted.map((r) => ({
    name: getRoomById(r.roomId)?.name || r.roomId,
    occupancy: r.weeklyOccupancy,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.occupancy)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 5: Create WeeklyHeatmap**

Create `src/components/stats/WeeklyHeatmap.tsx`:
```typescript
"use client";

import React from "react";
import { HeatmapCell } from "@/lib/types";

type Props = {
  cells: HeatmapCell[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9-18

function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return "bg-gray-100";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio > 0.75) return "bg-red-500";
  if (ratio > 0.5) return "bg-orange-400";
  if (ratio > 0.25) return "bg-yellow-300";
  return "bg-green-200";
}

export default function WeeklyHeatmap({ cells }: Props) {
  const maxCount = Math.max(...cells.map((c) => c.count), 1);
  const cellMap = new Map(cells.map((c) => [`${c.day}-${c.hour}`, c]));

  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(5, 1fr)` }}>
        {/* Header row */}
        <div />
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 pb-1">
            {day}
          </div>
        ))}

        {/* Data rows */}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-gray-500 text-right pr-2 leading-8">
              {`${hour}:00`}
            </div>
            {DAYS.map((_, dayIdx) => {
              const cell = cellMap.get(`${dayIdx}-${hour}`);
              const count = cell?.count || 0;
              const roomNames = cell?.rooms?.join(", ") || "";
              return (
                <div
                  key={`${dayIdx}-${hour}`}
                  className={`h-8 rounded-sm ${getCellColor(count, maxCount)} cursor-pointer transition-opacity hover:opacity-80`}
                  title={`${DAYS[dayIdx]} ${hour}:00 — ${count} booking(s)${roomNames ? `\nRooms: ${roomNames}` : ""}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-gray-100" />
        <div className="w-4 h-4 rounded-sm bg-green-200" />
        <div className="w-4 h-4 rounded-sm bg-yellow-300" />
        <div className="w-4 h-4 rounded-sm bg-orange-400" />
        <div className="w-4 h-4 rounded-sm bg-red-500" />
        <span>More</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create StatsView container**

Create `src/components/stats/StatsView.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useCalendarStats } from "@/hooks/useCalendarStats";
import WeekSelector from "./WeekSelector";
import KpiCards from "./KpiCards";
import RoomUsageChart from "./RoomUsageChart";
import WeeklyHeatmap from "./WeeklyHeatmap";

export default function StatsView() {
  const [weekOf, setWeekOf] = useState(new Date().toISOString().split("T")[0]);
  const { data, loading, error } = useCalendarStats(weekOf);

  if (loading) return <p className="text-gray-500">Loading stats...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <WeekSelector weekOf={weekOf} onChange={setWeekOf} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="space-y-6">
          <KpiCards rooms={data.rooms} />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Room Occupancy</h3>
            <RoomUsageChart rooms={data.rooms} />
          </div>
        </div>
        {/* Right panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Weekly Heatmap</h3>
          <WeeklyHeatmap cells={data.heatmap} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Wire StatsView into page.tsx**

Modify `src/app/page.tsx` — replace `{activeTab === "stats" && <div>Stats/Heatmap (Task 9)</div>}` with:
```typescript
import StatsView from "@/components/stats/StatsView";
// ...
{activeTab === "stats" && <StatsView />}
```

- [ ] **Step 8: Verify stats tab renders**

Run: `npm run dev`, sign in, confirm Stats/Heatmap tab shows KPI cards, bar chart, and heatmap.

- [ ] **Step 9: Commit**

```bash
git add src/components/stats/ package.json package-lock.json src/app/page.tsx
git commit -m "feat: implement Stats/Heatmap tab with KPIs, bar chart, and heatmap"
```

---

### Task 10: Today View Tab

**Files:**
- Create: `src/components/today/TodayView.tsx`
- Create: `src/components/today/RoomStatusCard.tsx`
- Create: `src/components/today/TodayTimeline.tsx`

- [ ] **Step 1: Create RoomStatusCard**

Create `src/components/today/RoomStatusCard.tsx`:
```typescript
import { CalendarEvent, MeetingRoom } from "@/lib/types";

type Status = "available" | "in-use" | "upcoming";

type Props = {
  room: MeetingRoom;
  events: CalendarEvent[];
  now: Date;
};

function getStatus(events: CalendarEvent[], now: Date): { status: Status; event?: CalendarEvent } {
  const current = events.find(
    (e) => new Date(e.start) <= now && new Date(e.end) > now
  );
  if (current) return { status: "in-use", event: current };

  const thirtyMinLater = new Date(now.getTime() + 30 * 60000);
  const upcoming = events.find(
    (e) => new Date(e.start) > now && new Date(e.start) <= thirtyMinLater
  );
  if (upcoming) return { status: "upcoming", event: upcoming };

  return { status: "available" };
}

const STATUS_CONFIG = {
  "available": { label: "Available", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  "in-use": { label: "In Use", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  "upcoming": { label: "Upcoming", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
};

export default function RoomStatusCard({ room, events, now }: Props) {
  const { status, event } = getStatus(events, now);
  const config = STATUS_CONFIG[status];

  const remaining = event && status === "in-use"
    ? Math.max(0, Math.round((new Date(event.end).getTime() - now.getTime()) / 60000))
    : null;

  const progress = event && status === "in-use"
    ? ((now.getTime() - new Date(event.start).getTime()) /
        (new Date(event.end).getTime() - new Date(event.start).getTime())) * 100
    : 0;

  return (
    <div className={`rounded-lg border p-4 ${config.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium">{room.name}</p>
          <p className="text-xs opacity-70">{room.floor} &middot; {room.capacity}seats</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
      {event && (
        <div className="mt-2">
          <p className="text-sm truncate">{event.title}</p>
          {remaining !== null && (
            <>
              <p className="text-xs mt-1">{remaining}min remaining</p>
              <div className="w-full bg-black/10 rounded-full h-1.5 mt-1">
                <div className="bg-current rounded-full h-1.5 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </>
          )}
          {status === "upcoming" && (
            <p className="text-xs mt-1">
              Starts at {new Date(event.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create TodayTimeline**

Create `src/components/today/TodayTimeline.tsx`:
```typescript
"use client";

import { CalendarEvent } from "@/lib/types";
import { MEETING_ROOMS } from "@/lib/rooms";

type Props = {
  events: CalendarEvent[];
  now: Date;
};

const START_HOUR = 9;
const END_HOUR = 19;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const ROOM_COLORS: Record<string, string> = {
  B1F_GENESIS: "bg-blue-400",
  B1F_CONSENSUS: "bg-purple-400",
  B1F_BEACON: "bg-teal-400",
  B1F_HARD_FORK: "bg-orange-400",
  "2F_MERKLE": "bg-pink-400",
  "1F_NONCE": "bg-indigo-400",
  B1F_LOUNGE: "bg-gray-400",
};

export default function TodayTimeline({ events, now }: Props) {
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent = ((nowHour - START_HOUR) / TOTAL_HOURS) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Today&apos;s Timeline</h3>

      {/* Hour labels */}
      <div className="relative ml-24">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
            <span key={i}>{START_HOUR + i}:00</span>
          ))}
        </div>
      </div>

      {/* Room rows */}
      {MEETING_ROOMS.map((room) => {
        const roomEvents = events.filter((e) => e.roomId === room.id);
        return (
          <div key={room.id} className="flex items-center h-8 mb-1">
            <div className="w-24 text-xs text-gray-600 truncate pr-2">{room.name}</div>
            <div className="flex-1 relative bg-gray-50 rounded h-6">
              {roomEvents.map((event) => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                const startH = start.getHours() + start.getMinutes() / 60;
                const endH = end.getHours() + end.getMinutes() / 60;
                const left = ((startH - START_HOUR) / TOTAL_HOURS) * 100;
                const width = ((endH - startH) / TOTAL_HOURS) * 100;

                return (
                  <div
                    key={event.id}
                    className={`absolute top-0 h-6 rounded text-[10px] text-white flex items-center px-1 truncate ${ROOM_COLORS[room.id] || "bg-gray-400"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${event.title} (${start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`}
                  >
                    {event.title}
                  </div>
                );
              })}

              {/* Now indicator */}
              {nowPercent >= 0 && nowPercent <= 100 && (
                <div
                  className="absolute top-0 w-0.5 h-6 bg-red-500 z-10"
                  style={{ left: `${nowPercent}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create TodayView container**

Create `src/components/today/TodayView.tsx`:
```typescript
"use client";

import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { MEETING_ROOMS } from "@/lib/rooms";
import RoomStatusCard from "./RoomStatusCard";
import TodayTimeline from "./TodayTimeline";

export default function TodayView() {
  const today = new Date().toISOString().split("T")[0];
  const { events, loading, error } = useCalendarEvents(today, "day");
  const now = new Date();

  if (loading) return <p className="text-gray-500">Loading today&apos;s schedule...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MEETING_ROOMS.map((room) => (
          <RoomStatusCard
            key={room.id}
            room={room}
            events={events.filter((e) => e.roomId === room.id)}
            now={now}
          />
        ))}
      </div>
      <TodayTimeline events={events} now={now} />
    </div>
  );
}
```

- [ ] **Step 4: Wire TodayView into page.tsx**

Replace placeholder: `{activeTab === "today" && <TodayView />}`

- [ ] **Step 5: Commit**

```bash
git add src/components/today/ src/app/page.tsx
git commit -m "feat: implement Today tab with room status cards and timeline"
```

---

### Task 11: Reservations Table Tab

**Files:**
- Create: `src/components/reservations/ReservationTable.tsx`

- [ ] **Step 1: Create ReservationTable**

Create `src/components/reservations/ReservationTable.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { MEETING_ROOMS } from "@/lib/rooms";
import { getRoomById } from "@/lib/rooms";

export default function ReservationTable() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [roomFilter, setRoomFilter] = useState("all");
  const { events, loading, error } = useCalendarEvents(date, "day");

  const filtered = roomFilter === "all"
    ? events
    : events.filter((e) => e.roomId === roomFilter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All Rooms</option>
          {MEETING_ROOMS.map((room) => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : sorted.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No reservations for this date</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Room</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Meeting</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Organizer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((event) => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                const room = getRoomById(event.roomId);
                const timeFmt = (d: Date) => d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{timeFmt(start)} - {timeFmt(end)}</td>
                    <td className="px-4 py-3">{room?.name || event.roomId}</td>
                    <td className="px-4 py-3 truncate max-w-xs">{event.title}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{event.organizer}</td>
                    <td className="px-4 py-3">{duration}min</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into page.tsx**

Replace placeholder: `{activeTab === "reservations" && <ReservationTable />}`

- [ ] **Step 3: Commit**

```bash
git add src/components/reservations/ src/app/page.tsx
git commit -m "feat: implement Reservations tab with date/room filters"
```

---

### Task 12: Room Recommendation Tab

**Files:**
- Create: `src/components/recommend/RecommendView.tsx`

- [ ] **Step 1: Create RecommendView**

Create `src/components/recommend/RecommendView.tsx`:
```typescript
"use client";

import { useState } from "react";
import { MeetingRoom } from "@/lib/types";

export default function RecommendView() {
  const [capacity, setCapacity] = useState(4);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [results, setResults] = useState<MeetingRoom[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/calendar/recommend?capacity=${capacity}&date=${date}&time=${time}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResults(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Find Available Room</h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Attendees</label>
            <input
              type="number"
              min={1}
              max={30}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">Error: {error}</p>}

      {results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No rooms available for this time slot.</p>
          ) : (
            results.map((room: any) => {
              const until = new Date(room.availableUntil);
              const untilStr = until.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-sm text-gray-500">{room.floor} &middot; {room.alias}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{room.capacity}</p>
                    <p className="text-xs text-gray-500">seats</p>
                    <p className="text-xs text-green-600 mt-1">Available until {untilStr}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into page.tsx**

Replace placeholder: `{activeTab === "recommend" && <RecommendView />}`

- [ ] **Step 3: Commit**

```bash
git add src/components/recommend/ src/app/page.tsx
git commit -m "feat: implement Room Recommendation tab"
```

---

### Task 13: Monthly PDF Report

**Files:**
- Install: `jspdf`, `html2canvas`
- Create: `src/app/api/report/monthly/route.ts`
- Modify: `src/components/stats/StatsView.tsx` (add Export button)

- [ ] **Step 1: Install PDF dependencies**

Run:
```bash
npm install jspdf html2canvas
npm install -D @types/html2canvas
```

- [ ] **Step 2: Create monthly report API route**

Create `src/app/api/report/monthly/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCalendarEvents } from "@/lib/calendar";
import { computeRoomStats, computeHeatmap } from "@/lib/stats";
import { MEETING_ROOMS } from "@/lib/rooms";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const startDate = new Date(`${month}-01T00:00:00+09:00`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const events = await fetchCalendarEvents(
    (session as any).accessToken,
    startDate.toISOString(),
    endDate.toISOString()
  );

  // Count weekdays in the month for accurate occupancy calculation
  let monthWeekdays = 0;
  const d = new Date(startDate);
  while (d < endDate) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) monthWeekdays++;
    d.setDate(d.getDate() + 1);
  }

  const stats = computeRoomStats(events, monthWeekdays);
  const heatmap = computeHeatmap(events);
  const totalBookings = events.length;
  const avgDuration = events.length > 0
    ? Math.round(events.reduce((sum, e) => {
        return sum + (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000;
      }, 0) / events.length)
    : 0;

  // Return JSON for client-side PDF generation
  return NextResponse.json({
    month,
    totalBookings,
    avgDuration,
    rooms: stats.map((s) => ({
      ...s,
      name: MEETING_ROOMS.find((r) => r.id === s.roomId)?.name || s.roomId,
    })),
    heatmap,
  });
}
```

- [ ] **Step 3: Add Export button to StatsView**

Modify `src/components/stats/StatsView.tsx` — add export button next to WeekSelector:
```typescript
// Add to imports
import jsPDF from "jspdf";

// Add export function inside StatsView component:
const exportPdf = async () => {
  const month = weekOf.slice(0, 7); // YYYY-MM
  const res = await fetch(`/api/report/monthly?month=${month}`);
  const report = await res.json();

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`DSRV Meeting Room Report — ${report.month}`, 14, 20);

  doc.setFontSize(11);
  doc.text(`Total Bookings: ${report.totalBookings}`, 14, 35);
  doc.text(`Avg Duration: ${report.avgDuration} min`, 14, 42);

  doc.setFontSize(12);
  doc.text("Room Occupancy", 14, 55);
  doc.setFontSize(10);
  report.rooms.forEach((r: any, i: number) => {
    doc.text(`${r.name}: ${r.weeklyOccupancy}% (${r.totalBookings} bookings)`, 14, 65 + i * 7);
  });

  doc.save(`dsrv-meeting-room-report-${report.month}.pdf`);
};

// Add button in JSX next to WeekSelector:
<button onClick={exportPdf} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700">
  Export PDF
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/report/ src/components/stats/StatsView.tsx package.json package-lock.json
git commit -m "feat: add monthly PDF report export"
```

---

### Task 14: README and Final Polish

**Files:**
- Create: `README.md`
- Verify all tabs work end-to-end

- [ ] **Step 1: Create README**

Create `README.md`:
```markdown
# DSRV Meeting Room Dashboard

Browser-based dashboard for visualizing DSRV meeting room reservations from Google Calendar.

## Features

- **Stats / Heatmap** — Room occupancy bar chart + weekly booking heatmap
- **Today** — Real-time room status cards + Gantt-style timeline
- **Reservations** — Filterable reservation table by date and room
- **Room Recommendation** — Find available rooms by attendees and time
- **PDF Export** — Monthly report download

## Prerequisites

- Node.js 18+
- Google Cloud Console project with Calendar API enabled

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Calendar API** (APIs & Services → Library)
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret**

## Setup

1. Clone and install:
   ```bash
   git clone <repo-url>
   cd meeting-room-dashboard
   npm install
   ```

2. Create `.env.local` from template:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   NEXTAUTH_SECRET=<run: openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CALENDAR_ID=c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com
   ```

4. Run:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000, sign in with Google.

## Tech Stack

- Next.js 14 (App Router)
- React 18 + Tailwind CSS
- next-auth v5 (Google OAuth)
- googleapis (Calendar API)
- recharts (charts)
- jsPDF (PDF export)
```

- [ ] **Step 2: End-to-end verification**

Run: `npm run dev`
Verify:
1. Sign in with Google works
2. Stats/Heatmap tab: KPI cards, bar chart, heatmap render with real data
3. Today tab: Room status cards show correct state, timeline renders
4. Reservations tab: Date picker and room filter work, table populates
5. Recommend tab: Search returns available rooms
6. PDF export downloads a file

- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```
