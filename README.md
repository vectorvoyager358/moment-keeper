# Moment Keeper

A home for life's moments — capture and revisit meaningful memories without the pressure of daily journaling.

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Hosting:** [Vercel](https://vercel.com)
- **Backend:** [Supabase](https://supabase.com) (auth, Postgres, storage)
- **CI:** GitHub Actions (lint, format, test, build)

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

3. Add your Supabase project URL and publishable key from **Project Settings → API** in the [Supabase dashboard](https://supabase.com/dashboard).

4. In Supabase, enable email auth: **Authentication → Providers → Email** (enabled by default). For faster local testing, you can disable **Confirm email** so new accounts can log in immediately.

5. In Supabase → **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` and add these **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

6. Apply the database schema (one-time) — see [Database setup](#database-setup) below.

7. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Dev server errors (`@swc/helpers` / Turbopack)

If you see a missing `@swc/helpers-...` module error, stop the dev server and clear the cache:

```bash
npm run clean
npm run dev
```

Or in one step: `npm run dev:clean`

If it persists: `rm -rf node_modules .next && npm install`

## Routes

| Route               | Access                                             |
| ------------------- | -------------------------------------------------- |
| `/login`            | Public                                             |
| `/signup`           | Public                                             |
| `/forgot-password`  | Public (request reset email)                       |
| `/auth/callback`    | Public (PKCE code exchange for email links)        |
| `/reset-password`   | Authenticated (set new password after reset email) |
| `/api/health`       | Public (uptime / readiness JSON)                   |
| `/api/moments`      | Authenticated (create moment; XHR upload progress) |
| `/api/moments/[id]` | Authenticated (update moment; XHR upload progress) |
| `/timeline`         | Authenticated (search + list)                      |
| `/capture`          | Authenticated                                      |
| `/moments/[id]`     | Authenticated (view / edit / delete)               |
| `/settings`         | Authenticated (account + change password)          |

## Database setup

1. Open **SQL Editor** in the [Supabase dashboard](https://supabase.com/dashboard).
2. Run the SQL in [`supabase/migrations/20260707143000_initial_schema.sql`](supabase/migrations/20260707143000_initial_schema.sql).
3. Run later migrations in order, including [`supabase/migrations/20260708200000_search_moment_ids.sql`](supabase/migrations/20260708200000_search_moment_ids.sql) for full-text search.

See [`supabase/README.md`](supabase/README.md) for verification steps.

## Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start local dev server       |
| `npm run build`        | Production build             |
| `npm run start`        | Run production build locally |
| `npm run lint`         | ESLint                       |
| `npm run format`       | Prettier write               |
| `npm run format:check` | Prettier check               |
| `npm run test`         | Run unit tests (Vitest)      |

## CI

On every push/PR to `main`, GitHub Actions runs lint, format check, tests, and build. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Deploy to Vercel

### Option A: Vercel dashboard (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the `moment-keeper` repository.
3. Add environment variables for **Production** (and Preview if you want PR deploys):

   | Variable                        | Value                         |
   | ------------------------------- | ----------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase publishable key |

4. Click **Deploy**.

### Option B: Vercel CLI

```bash
npm i -g vercel          # if not installed
vercel login
vercel link              # link to a new or existing project
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

### After deploy

1. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add **Redirect URLs** for:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`
2. Visit your deployed URL and sign up / log in. Password reset emails use `/auth/callback?next=/reset-password`.

## Project structure

```
src/
  app/          # Routes and layouts (Next.js App Router)
  components/   # UI components
  lib/          # Utilities and API clients (e.g. Supabase)
tests/
  unit/         # Unit tests
docs/           # Data model, backlog, decision log
supabase/
  migrations/   # SQL schema + RLS
.github/
  workflows/    # CI
```

## Documentation

- [`docs/data-model.md`](docs/data-model.md) — entities and schema
- [`docs/mvp-backlog.md`](docs/mvp-backlog.md) — user stories and tickets
- [`docs/decisions.md`](docs/decisions.md) — technical decisions + performance budgets
- [`docs/roadmap.md`](docs/roadmap.md) — post-MVP phases and epics
