# Moment Keeper

A home for life's moments — capture and revisit meaningful memories without the pressure of daily journaling.

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Hosting:** [Vercel](https://vercel.com)
- **Backend:** [Supabase](https://supabase.com) (auth, Postgres, storage)

See [`docs/decisions.md`](docs/decisions.md) for architecture decisions and [`docs/mvp-backlog.md`](docs/mvp-backlog.md) for the implementation backlog.

## Prerequisites

- Node.js 20+ (22 LTS recommended)
- npm
- A [Supabase](https://supabase.com) project (free tier)

## Local setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase project URL and anon key from **Project Settings → API** in the [Supabase dashboard](https://supabase.com/dashboard).

4. In Supabase, enable email auth: **Authentication → Providers → Email** (enabled by default). For faster local testing, you can disable **Confirm email** under **Authentication → Providers → Email** so new accounts can log in immediately.

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are redirected to `/login`. After sign-up or log-in, you'll land on `/timeline`.

## Auth routes

| Route | Access |
|-------|--------|
| `/login` | Public |
| `/signup` | Public |
| `/timeline` | Authenticated |
| `/settings` | Authenticated (email + log out) |

## Database setup

After configuring `.env.local`, apply the database schema:

1. Open **SQL Editor** in the [Supabase dashboard](https://supabase.com/dashboard).
2. Run the SQL in [`supabase/migrations/20260707143000_initial_schema.sql`](supabase/migrations/20260707143000_initial_schema.sql).

See [`supabase/README.md`](supabase/README.md) for details and verification steps.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run test` | Run unit tests (Vitest) |

## Project structure

```
src/
  app/          # Routes and layouts (Next.js App Router)
  components/   # UI components
  lib/          # Utilities and API clients (e.g. Supabase)
tests/
  unit/         # Unit tests
  integration/  # Integration tests (added as features land)
docs/           # Data model, backlog, decision log
supabase/
  migrations/   # SQL schema + RLS (run in Supabase dashboard or via CLI)
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
4. Deploy — Vercel auto-detects Next.js.

## Documentation

- [`docs/data-model.md`](docs/data-model.md) — entities and schema
- [`docs/mvp-backlog.md`](docs/mvp-backlog.md) — user stories and tickets
- [`docs/decisions.md`](docs/decisions.md) — technical decisions
