# DSRV Meeting Room Dashboard — Design Spec

## Overview

A browser-based dashboard that visualizes DSRV meeting room reservation data from Google Calendar. Primary users are HR team and management who need to understand room utilization patterns at a glance — which time slots are busiest and which rooms are most popular.

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS
- **Auth:** next-auth (AuthJS v5) with Google OAuth 2.0
- **Calendar API:** googleapis (`@googleapis/calendar`)
- **Charts:** recharts (bar charts), CSS grid (heatmap)
- **PDF:** react-pdf or html2canvas + jsPDF (monthly report export)
- **Timezone:** Asia/Seoul (fixed)

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌─────┬──────────┬──────────┬────────────┐ │
│  │Stats│  Today   │Reservations│  Recommend │ │
│  └─────┴──────────┴──────────┴────────────┘ │
│         React Client Components              │
└──────────────────┬──────────────────────────┘
                   │ fetch (on page load)
┌──────────────────▼──────────────────────────┐
│           Next.js API Routes                 │
│  /api/auth/[...nextauth]  ← Google OAuth     │
│  /api/calendar/events     ← event query      │
│  /api/calendar/stats      ← computed stats   │
│  /api/calendar/recommend  ← room suggestion  │
│  /api/report/monthly      ← PDF generation   │
└──────────────────┬──────────────────────────┘
                   │ googleapis
┌──────────────────▼──────────────────────────┐
│         Google Calendar API                  │
│  Calendar ID:                                │
│  c_3csipio0le728mjl6gdgo8j3e4@group...      │
└─────────────────────────────────────────────┘
```

**Key decisions:**
- OAuth tokens live server-side only (security)
- API Routes handle data fetching + transformation; client only renders
- Data fetched once on page load (no polling)

## Calendar Data

### Calendar ID

`c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com`

### Meeting Rooms

| ID | Name | Floor | Capacity | Alias |
|----|------|-------|----------|-------|
| B1F_GENESIS | GENESIS | B1F | 12 | Meeting Room 1 |
| B1F_CONSENSUS | CONSENSUS | B1F | 6 | Meeting Room 2 |
| B1F_BEACON | BEACON | B1F | 12 | Meeting Room 3 |
| B1F_HARD_FORK | HARD FORK | B1F | 6 | Meeting Room 4 |
| 2F_MERKLE | MERKLE | 2F | 6 | Meeting Room 2 |
| 1F_NONCE | NONCE | 1F | 6 | Meeting Room 2 |
| B1F_LOUNGE | Lounge | B1F | 30 | Lounge |

### Room Identification Logic

Priority order when parsing events:
1. `attendees` array — match `resource.calendar.google.com` emails to room resources (resource emails are discovered at runtime from the calendar API response, not hardcoded)
2. `location` field — pattern match room names (e.g., "B1F_GENESIS")

### Data Types

```typescript
type MeetingRoom = {
  id: string;        // "B1F_GENESIS"
  name: string;      // "GENESIS"
  floor: string;     // "B1F"
  capacity: number;  // 12
  alias: string;     // "Meeting Room 1"
}

type CalendarEvent = {
  id: string;
  title: string;
  start: string;     // ISO 8601, Asia/Seoul
  end: string;
  roomId: string;    // matches MeetingRoom.id
  organizer: string; // organizer email
}

type RoomStats = {
  roomId: string;
  weeklyOccupancy: number;  // percentage (0-100)
  totalBookings: number;
  avgDurationMinutes: number;
}

type HeatmapCell = {
  day: number;       // 0=Mon, 4=Fri
  hour: number;      // 9-18
  count: number;     // number of bookings (aggregated across ALL rooms)
}
```

## API Routes

| Route | Method | Purpose | Parameters | Response |
|-------|--------|---------|------------|----------|
| `/api/auth/[...nextauth]` | * | Google OAuth flow | — | Session |
| `/api/calendar/events` | GET | Fetch events for date range | `date` (YYYY-MM-DD), `range` (day\|week) | `CalendarEvent[]` |
| `/api/calendar/stats` | GET | Computed room statistics | `weekOf` (YYYY-MM-DD, Monday of target week) | `{ rooms: RoomStats[], heatmap: HeatmapCell[] }` |
| `/api/calendar/recommend` | GET | Recommend available rooms | `capacity` (min seats), `date` (YYYY-MM-DD), `time` (HH:mm) | `MeetingRoom[]` |
| `/api/report/monthly` | GET | Generate PDF report | `month` (YYYY-MM) | PDF binary |

## UI Design

### Layout

- Tab-based navigation at the top
- Tabs: **Stats/Heatmap** (default) | **Today** | **Reservations** | **Recommend**
- Header: DSRV logo + logged-in user + logout button
- Responsive: optimized for desktop (1280px+), functional on tablet

### Tab 1: Stats/Heatmap (Main — default tab)

**Left-right split layout.**

**Left panel — Room Statistics:**
- KPI cards at top: Total bookings this week, Average meeting duration
- Horizontal bar chart (sorted by occupancy, descending)
  - Color coding: 80%+ red, 50-80% yellow, <50% green
- Week selector to navigate between weeks
- "Export PDF" button for monthly report

**Right panel — Weekly Heatmap:**
- X-axis: Mon–Fri
- Y-axis: 09:00–19:00 (1-hour slots)
- Cell color intensity = number of bookings in that slot
- Hover tooltip: booking count, list of rooms booked
- Color scale legend

### Tab 2: Today

- Room status cards (one per room):
  - 🟢 Available — no current meeting
  - 🔴 In Use — meeting name, remaining time, progress bar
  - 🟡 Upcoming — next meeting starts within 30 minutes
- Below cards: today's remaining schedule as a Gantt-style timeline
  - One row per room
  - Blocks colored by room
  - Current time indicator (vertical line)

### Tab 3: Reservations

- Filters: date picker, room dropdown (All / individual rooms)
- Table columns: Time, Room, Meeting Title, Organizer, Duration
- Default sort: ascending by time
- Empty state: "No reservations for this date"

### Tab 4: Room Recommendation

- Input: number of attendees, preferred date, preferred time
- Output: list of available rooms that fit the capacity requirement
- Sorted by: best fit (smallest room that fits)
- Shows: room name, floor, capacity, availability window

## File Structure

```
src/
  app/
    layout.tsx                  ← root layout with auth provider
    page.tsx                    ← main dashboard page
    api/
      auth/[...nextauth]/
        route.ts                ← next-auth Google OAuth
      calendar/
        events/route.ts         ← events endpoint
        stats/route.ts          ← stats endpoint
        recommend/route.ts      ← room recommendation
      report/
        monthly/route.ts        ← PDF generation
  components/
    layout/
      Header.tsx                ← logo + auth status
      TabNavigation.tsx         ← tab switcher
    stats/
      StatsView.tsx             ← main tab container (left-right split)
      KpiCards.tsx              ← total bookings, avg duration
      RoomUsageChart.tsx        ← horizontal bar chart
      WeeklyHeatmap.tsx         ← heatmap grid
      WeekSelector.tsx          ← week navigation
    today/
      TodayView.tsx             ← today tab container
      RoomStatusCard.tsx        ← individual room status
      TodayTimeline.tsx         ← Gantt-style timeline
    reservations/
      ReservationTable.tsx      ← table with filters
    recommend/
      RecommendView.tsx         ← room recommendation UI
  lib/
    auth.ts                     ← next-auth config
    calendar.ts                 ← Google Calendar API client
    rooms.ts                    ← room master data + parsing logic
    stats.ts                    ← stats computation functions
    types.ts                    ← shared TypeScript types
  hooks/
    useCalendarEvents.ts        ← fetch events hook
    useCalendarStats.ts         ← fetch stats hook
```

## Authentication Flow

1. User visits dashboard → redirected to Google OAuth consent screen
2. next-auth handles callback, stores tokens in encrypted JWT session
3. API Routes extract access_token from session to call Google Calendar API
4. Token refresh handled automatically by next-auth

### Required OAuth Scopes

- `https://www.googleapis.com/auth/calendar.readonly`

## Environment Variables

```env
# .env.local
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_SECRET=<random string for JWT encryption>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CALENDAR_ID=c_3csipio0le728mjl6gdgo8j3e4@group.calendar.google.com
```

## Constraints

- API keys in `.env` file (`.env.example` provided)
- Timezone: `Asia/Seoul` fixed everywhere
- Business hours: 09:00–19:00, Mon–Fri
- HARD FORK room included in master data (marked as upcoming, shown when data exists)

## Success Criteria

- `npm run dev` → localhost shows all 4 tabs working
- Google OAuth login flow completes successfully
- Stats/Heatmap tab shows real calendar data with correct occupancy calculations
- Today tab shows current room status accurately
- Reservations tab filters and sorts correctly
- README includes Google Cloud Console setup instructions (OAuth client ID)
