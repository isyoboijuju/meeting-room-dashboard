@AGENTS.md

# Project: DSRV Meeting Room Dashboard

## Git Workflow

- **Work on `dev` branch.** Never commit directly to `main`.
- After user says "commit and push" (or similar), do all of the following:
  1. Commit to `dev` with conventional commit message
  2. Push `dev` to origin
  3. Merge `dev` into `main` (fast-forward)
  4. Push `main` to origin (triggers Vercel auto-deploy)
  5. Switch back to `dev`

## Deployment

- **Platform:** Vercel (auto-deploys on `main` push)
- **Production URL:** https://meeting-room-dashboard-wine.vercel.app
- **GitHub:** https://github.com/isyoboijuju/meeting-room-dashboard

## Critical: Timezone

Vercel runs in **UTC**. All date logic must avoid `getDay()`/`getDate()` on `new Date("...+09:00")` objects — those return UTC values, not KST. Parse date strings with `new Date(y, m-1, d)` for arithmetic, then convert to KST ISO when calling Google Calendar API. See `parseLocalDate()` in `stats/route.ts`.

## Auth

- Google OAuth via next-auth v5
- Login restricted to `@dsrvlabs.com` domain (enforced in `src/lib/auth.ts` signIn callback)

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- Google Calendar API for data
- recharts for charts, jsPDF + html2canvas for PDF export
- All UI text in Korean, all code/comments in English

## Key Directories

- `src/lib/` — auth, calendar API, stats computation, room config, date utils
- `src/components/stats/` — dashboard UI (heatmap, charts, PDF export)
- `src/app/api/` — API routes (calendar stats, events, recommendations, reports)
