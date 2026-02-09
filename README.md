# Doubts App (Production MVP)

Production-ready web app to capture, filter, search, and clear doubts with plain-text notes and image attachments.

## Stack

- Next.js (App Router, TypeScript)
- Supabase (Postgres + Auth + Storage)
- Supabase RLS for per-user data isolation
- Sentry for frontend/API error tracking
- Tailwind CSS v4
- daisyUI components
- Vitest for unit tests

## Features (v1)

- Email/password login
- Doubt CRUD
- Filters: `subject`, `subtopic`, `difficulty`, `error_tag`, `is_cleared`
- Keyword search over title/body/subject/subtopics/error tags
- Attachment uploads via presigned URLs (private storage bucket)
- Signed short-lived download URLs for viewing attachments
- Plain-text notes (no markdown renderer)
- Cursor pagination
- `/api/health` endpoint for uptime monitoring
- Structured JSON logging for API actions/errors

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

3. Fill required vars in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

Optional but recommended:

- `SUPABASE_SERVICE_ROLE_KEY` (only needed for future admin-level operations)
- `NEXT_PUBLIC_ALLOWED_EMAIL` (single-user enforcement)
- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`

4. Apply SQL migration in Supabase:

- Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.

5. Disable public signup in Supabase Auth:

- Supabase Dashboard -> Authentication -> Providers -> disable open signup.

6. Start dev server:

```bash
npm run dev
```

## API Surface

- `POST /api/doubts`
- `GET /api/doubts?q&subject&subtopic&difficulty&error_tag&is_cleared&cursor&limit`
- `GET /api/doubts/:id`
- `PATCH /api/doubts/:id`
- `DELETE /api/doubts/:id`
- `PATCH /api/doubts/:id/clear`
- `POST /api/doubts/:id/attachments/presign`
- `DELETE /api/attachments/:id`
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
- Ensure Supabase daily backups are enabled
- Configure uptime monitor to hit `/api/health` every minute
- Connect Sentry DSN for client + server error tracking
- Keep `NEXT_PUBLIC_ALLOWED_EMAIL` set for single-user v1

## Data Model

Main tables:

- `public.doubts`
- `public.doubt_attachments`

Enum:

- `public.difficulty_enum` (`easy`, `medium`, `hard`)

Storage bucket:

- `doubts-attachments` (private)

All schema, indexes, RLS, and storage policies are in `supabase/migrations/0001_init.sql`.
