# DSRV Meeting Room Dashboard

Browser-based dashboard for visualizing DSRV meeting room reservations from Google Calendar.

## Features

- **Stats / Heatmap** — Room occupancy bar chart + weekly booking heatmap (Mon-Fri, 09:00-19:00)
- **Today** — Real-time room status cards + Gantt-style timeline
- **Reservations** — Filterable reservation table by date and room
- **Room Recommendation** — Find available rooms by attendees and time
- **PDF Export** — Monthly report download

## Tech Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS
- next-auth v5 (Google OAuth 2.0)
- Google Calendar API (googleapis)
- recharts (bar charts)
- jsPDF (PDF export)

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

## Meeting Rooms

| Room | Floor | Capacity |
|------|-------|----------|
| GENESIS | B1F | 12 |
| CONSENSUS | B1F | 6 |
| BEACON | B1F | 12 |
| HARD FORK | B1F | 6 |
| MERKLE | 2F | 6 |
| NONCE | 1F | 6 |
| Lounge | B1F | 30 |
