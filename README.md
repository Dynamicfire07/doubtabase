# Doubts App (Rooms Collaboration V1)

Production-ready web app to capture, filter, search, and collaborate on doubts in personal and shared workspaces.

## Stack

- Next.js (App Router, TypeScript)
- Supabase (Postgres + Auth + Storage + Realtime)
- Supabase RLS for room-scoped access control
- Sentry for frontend/API error tracking
- Tailwind CSS v4 + daisyUI
- Vitest for unit tests

## Features

- Hero landing page at `/`
- Email/password signup with name capture
- Email/password login
- Workspaces:
  - Personal room per user (private)
  - Shared rooms (owner + members)
- Room invite codes (reusable until owner rotates)
- Spreadsheet-like doubt entry and editing
- Doubt CRUD + clear toggle + filters + keyword search
- Owner-only deletes in shared rooms
- Attachment uploads via presigned URLs (private bucket)
- Realtime sync across members in open rooms
- Room-scoped comments on doubt detail pages
- Shared-room email notification on new doubts (SMTP)
- `/api/health` endpoint for uptime monitoring
- Structured JSON logs for API actions/errors

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env.local
```

3. Fill required env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` (required for secure room-join flow)

Optional:

- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
- `SUPABASE_ATTACHMENTS_BUCKET` (defaults to `doubts-attachments`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for shared-room doubt email notifications)

4. Apply SQL migrations in Supabase SQL Editor, in order:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_rooms.sql`
- `supabase/migrations/0003_doubt_comments.sql`

5. Configure Supabase Auth based on your preference:

- If you want public signup, keep email/password signup enabled.
- If you want invite-only, disable open signup in Supabase Dashboard and pre-create users.

6. Start dev server:

```bash
npm run dev
```

## API Surface

### Rooms

- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/join`
- `POST /api/rooms/:roomId/invite/rotate`
- `GET /api/rooms/:roomId/members`

### Doubts

- `POST /api/doubts` (supports `room_id`; falls back to personal room if omitted)
- `GET /api/doubts?room_id&q&subject&subtopic&difficulty&error_tag&is_cleared&cursor&limit`
- `GET /api/doubts/:id`
- `PATCH /api/doubts/:id`
- `DELETE /api/doubts/:id` (owner-only in shared rooms)
- `PATCH /api/doubts/:id/clear`
- `POST /api/doubts/:id/attachments/presign`
- `POST /api/doubts/:id/comments`
- `DELETE /api/attachments/:id` (owner-only in shared rooms)
- `GET /api/health`

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Production Checklist

- Deploy app to Vercel
- Configure production env vars in Vercel
- Apply `0002_rooms.sql` before deploying app code
- Ensure Supabase daily backups are enabled
- Configure uptime monitor for `/api/health`
- Connect Sentry DSN for client + server error tracking

## Data Model

Main tables:

- `public.rooms`
- `public.room_members`
- `public.room_invites`
- `public.doubts`
- `public.doubt_attachments`
- `public.doubt_comments`

Enums:

- `public.difficulty_enum` (`easy`, `medium`, `hard`)
- `public.room_role_enum` (`owner`, `member`)

Storage bucket:

- `doubts-attachments` (private)

All schema, indexes, RLS, and storage policies are in:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_rooms.sql`
- `supabase/migrations/0003_doubt_comments.sql`
