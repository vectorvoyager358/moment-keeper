# Decision Log — Moment Keeper

Significant technical decisions. Add a row when a choice is made — don't relitigate without new information.

| Date       | Decision                                            | Reasoning                                                                                                                          |
| ---------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-07 | **Stack: Next.js (App Router) + Supabase + Vercel** | React frontend on Vercel; Supabase bundles auth, Postgres, and object storage. Low ops for solo builder.                           |
| 2026-07-07 | **Frontend hosting: Vercel**                        | Zero-config Next.js deploys, preview URLs per PR, free hobby tier. Code stays in GitHub; Vercel deploys from the repo.             |
| 2026-07-07 | **Auth: email + password (Supabase Auth)**          | Simple account model for MVP; no social login in v1.                                                                               |
| 2026-07-07 | **Budget: free tiers (Vercel + Supabase)**          | Sufficient for self-use MVP; revisit paid tiers when usage grows.                                                                  |
| 2026-07-07 | Server-side search (not E2E) for MVP                | Product brief defers client-side E2E encryption; Postgres full-text search covers keyword + tag queries without client decryption. |
| 2026-07-07 | One media attachment per moment (MVP)               | Keeps capture fast and storage logic simple; multiple attachments deferred.                                                        |
| 2026-07-07 | Tags unique per user (case-insensitive)             | Prevents "work" / "Work" duplicates cluttering tag filter UI.                                                                      |
| 2026-07-07 | **Auth via `@supabase/ssr` cookie sessions**        | Works with Next.js middleware for session refresh and protected routes.                                                            |
| 2026-07-07 | **Schema in `supabase/migrations/`**                | SQL migrations applied via Supabase dashboard or CLI; RLS enforces per-user data access.                                           |
| 2026-07-07 | **CI via GitHub Actions**                           | Runs lint, format check, tests, and build on every push/PR to `main`.                                                              |
