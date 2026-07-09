# Decision Log — Moment Keeper

Significant technical decisions. Add a row when a choice is made — don't relitigate without new information.

| Date       | Decision                                            | Reasoning                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-07 | **Stack: Next.js (App Router) + Supabase + Vercel** | React frontend on Vercel; Supabase bundles auth, Postgres, and object storage. Low ops for solo builder.                                                                                                    |
| 2026-07-07 | **Frontend hosting: Vercel**                        | Zero-config Next.js deploys, preview URLs per PR, free hobby tier. Code stays in GitHub; Vercel deploys from the repo.                                                                                      |
| 2026-07-07 | **Auth: email + password (Supabase Auth)**          | Simple account model for MVP; no social login in v1.                                                                                                                                                        |
| 2026-07-07 | **Budget: free tiers (Vercel + Supabase)**          | Sufficient for self-use MVP; revisit paid tiers when usage grows.                                                                                                                                           |
| 2026-07-07 | Server-side search (not E2E) for MVP                | Product brief defers client-side E2E encryption; Postgres full-text search covers keyword + tag queries without client decryption.                                                                          |
| 2026-07-07 | One media attachment per moment (MVP)               | Keeps capture fast and storage logic simple; multiple attachments deferred.                                                                                                                                 |
| 2026-07-07 | Tags unique per user (case-insensitive)             | Prevents "work" / "Work" duplicates cluttering tag filter UI.                                                                                                                                               |
| 2026-07-07 | **Auth via `@supabase/ssr` cookie sessions**        | Works with Next.js middleware for session refresh and protected routes.                                                                                                                                     |
| 2026-07-07 | **Schema in `supabase/migrations/`**                | SQL migrations applied via Supabase dashboard or CLI; RLS enforces per-user data access.                                                                                                                    |
| 2026-07-07 | **CI via GitHub Actions**                           | Runs lint, format check, tests, and build on every push/PR to `main`.                                                                                                                                       |
| 2026-07-08 | **Password reset via PKCE + `/auth/callback`**      | `resetPasswordForEmail` redirects to a server route that exchanges the code, then sends the user to `/reset-password`. Avoids tokens in the page URL and open redirects.                                    |
| 2026-07-08 | **Keyword search via `search_moment_ids` RPC**      | Uses existing `search_vector` + GIN index with `ts_rank`. RPC needed because PostgREST can't order by `ts_rank` in a plain select. Tag-only search stays on the table query.                                |
| 2026-07-08 | **Vercel CLI not a project dependency**             | Deploy CLI is install-global (`npm i -g vercel`); keeping it in `dependencies` bloated installs and production trees for no runtime benefit.                                                                |
| 2026-07-08 | **Public `/api/health` for uptime checks**          | Returns `{ status: "ok" }` without auth so monitors can probe the deploy. Reports whether Supabase env is present; does not call Supabase (keeps the check cheap).                                          |
| 2026-07-08 | **Client-side photo compression before upload**     | Canvas resize/JPEG encode for large photos (≥300KB). No new deps; GIFs/video/audio unchanged. Progress UI covers prepare + save pending states.                                                             |
| 2026-07-08 | **Raise proxy body limit to 52mb**                  | Next.js defaults to buffering 10 MB through proxy/middleware. Audio/video under app limits still failed with "Unexpected end of form" until `proxyClientMaxBodySize` matched `serverActions.bodySizeLimit`. |
| 2026-07-08 | **Capture/edit upload via XHR for real % progress** | `fetch`/server actions don't expose upload progress. Forms POST to `/api/moments` with `XMLHttpRequest.upload.onprogress`; shared save logic lives in `lib/moments/save.ts`.                                |
| 2026-07-08 | **Documented Core Web Vitals budgets (Phase 2)**    | Measure before optimizing. Budgets below are the bar for timeline/capture/detail; Lighthouse CI can enforce later.                                                                                          |
| 2026-07-08 | **Timeline streams via Suspense boundaries**        | Shell (nav/header) paints first; search tags and moment feed load in separate Suspense fallbacks so one slow query doesn't block the whole page.                                                            |
| 2026-07-08 | **Photo thumbnails via sharp on upload**            | Stores `thumbnail_path` beside the original; timeline signs thumbnail URLs in batch. Avoids loading full photos on the list. Video/audio thumbnails deferred.                                               |
| 2026-07-08 | **Sentry error tracking (opt-in via DSN)**          | `@sentry/nextjs` initializes only when `NEXT_PUBLIC_SENTRY_DSN` is set. Captures client/server/edge + route error boundaries; no Session Replay; `sendDefaultPii: false`.                                   |
| 2026-07-08 | **Vercel Web Analytics for aggregate traffic**      | `@vercel/analytics` tracks page views only (no PII, no custom events). Cookie-free; disabled in dev; opt out via `NEXT_PUBLIC_ANALYTICS_DISABLED=true`. Documented in `docs/analytics.md`.                  |
| 2026-07-08 | **Warm archival visual identity (Phase 3)**         | Cream/paper palette, honey accent, Lora + Source Sans 3, shared UI primitives (`Button`, `Input`, `Card`, `Tag`, `Alert`). Replaces generic zinc defaults on core routes.                                   |
| 2026-07-08 | **CSS motion with reduced-motion respect**          | Save-success toast on timeline after capture; staggered card fade-in; skeletons match card layout. No animation library — `prefers-reduced-motion` disables transforms.                                     |
| 2026-07-08 | **On this day resurfacing on timeline**             | `on_this_day_moment_ids` RPC matches UTC month/day on `occurred_at`, excludes current year. Horizontal scroll section on timeline with years-ago labels.                                                    |
| 2026-07-09 | **In-browser voice memo on capture/edit**           | MediaRecorder API records audio in the browser (free, no API). Attaches as `audio/webm` / `audio/mp4` to the existing media upload; 10-minute cap; works on capture and edit forms.                         |
| 2026-07-09 | **In-browser camera photo on capture/edit**         | `getUserMedia` video preview + canvas JPEG capture; prefers rear camera on mobile; runs through existing photo compression before upload. Free — no third-party API.                                        |

---

## Performance budgets (Phase 2)

Targets for authenticated app routes on a mid-tier mobile device / Lighthouse mobile. Prefer fixing regressions that miss these over adding features that make them worse.

### Core Web Vitals (all key routes)

| Metric   | Budget  | Notes                                    |
| -------- | ------- | ---------------------------------------- |
| **LCP**  | ≤ 2.5s  | Largest contentful paint                 |
| **INP**  | ≤ 200ms | Interaction to next paint                |
| **CLS**  | ≤ 0.1   | Layout shift (skeletons should match UI) |
| **TTFB** | ≤ 800ms | Server response for HTML / RSC payload   |

### Route-specific

| Route           | Extra targets                                                                                |
| --------------- | -------------------------------------------------------------------------------------------- |
| `/timeline`     | Lighthouse Performance ≥ 90 (mobile); first page of moments without blocking media downloads |
| `/capture`      | Perceived save feedback ≤ 100ms; photo prepare progress visible while compressing            |
| `/moments/[id]` | Media loads after text (progressive); signed URL fetch must not block body paint             |
| Search (`?q=`)  | Keyword search p95 ≤ 200ms at ~500 moments (RPC + hydrate)                                   |

### Media & payload

| Constraint            | Budget / rule                                                  |
| --------------------- | -------------------------------------------------------------- |
| Timeline page size    | 20 moments (`TIMELINE_PAGE_SIZE`)                              |
| Photo upload prep     | Max edge 1920px; JPEG quality ~0.82; skip if &lt; ~300 KB      |
| Photo / video / audio | 10 / 50 / 25 MB hard caps                                      |
| Timeline cards        | No full media fetch on list; detail page loads media on demand |

### How to measure

1. Chrome DevTools → Lighthouse (mobile) on `/timeline`, `/capture`, `/moments/[id]` while logged in.
2. Optional: WebPageTest against the Vercel production URL.
3. Later: add Lighthouse CI to GitHub Actions once budgets are stable.

Do not treat these as marketing claims — they are engineering guardrails for Phase 2+ work.
