# MVP Backlog — Moment Keeper

User stories and implementation tickets for Phase 1. Organized by screen/area.

**Suggested implementation order:** Auth → Capture → Timeline → Moment Detail → Search → Settings/polish

---

## User Stories (MVP)

### Capture

- As a user, I want to quickly write down what happened in a moment, so that I can preserve it before I forget.
- As a user, I want to attach up to five photos, videos, or audio clips to a moment, so that I can preserve a richer memory in one entry.
- As a user, I want to set or edit when a moment occurred, so that I can backdate moments I log later.
- As a user, I want to add custom tags while creating a moment, so that I can organize moments my own way.
- As a user, I want to save a moment in under 30 seconds, so that capturing never feels like a chore.

### Timeline

- As a user, I want to see all my moments in reverse-chronological order, so that I can browse my recent and past memories easily.
- As a user, I want each timeline entry to show a preview of the text, date, tags, and media indicator, so that I can scan quickly.
- As a user, I want to tap a moment to open its detail view, so that I can read or edit the full entry.
- As a user, I want to favorite meaningful moments and filter my journal to them, so that I can return to them quickly.

### Search

- As a user, I want to search moments by keyword, so that I can find a specific memory by what I wrote.
- As a user, I want to filter moments by tag, so that I can pull up all moments in a category (e.g. "work", "family").
- As a user, I want to combine keyword and tag filters, so that I can narrow down to exactly what I'm looking for.

### Moment Detail

- As a user, I want to view the full text, date, tags, and media for a moment, so that I can fully revisit that memory.
- As a user, I want to edit a moment's text, date, tags, and attachment, so that I can fix mistakes or add context later.
- As a user, I want to delete a moment, so that I can remove entries I no longer want to keep.

### Auth & Settings

- As a user, I want to create an account and log in, so that my moments are private and tied to me.
- As a user, I want to log out, so that I can secure my account on shared devices.
- As a user, I want my data to be private by default, so that I feel safe storing emotionally sensitive memories.

---

## Tickets by Area

### Auth / Foundation

| ID      | Title                      | Description                                                                  | Acceptance criteria                                                              |
| ------- | -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AUTH-01 | Project scaffold           | Initialize web app, linting, env config, folder structure per dev guidelines | App runs locally; `.env.example` documents required vars; README has setup steps |
| AUTH-02 | Choose & wire backend      | Integrate auth + DB + storage provider (see `decisions.md`)                  | User can sign up, log in, log out; session persists across refresh               |
| AUTH-03 | Database schema            | Create tables per `data-model.md` with RLS / access rules                    | Migrations apply cleanly; users can only read/write their own rows               |
| AUTH-04 | Protected routes           | Redirect unauthenticated users to login                                      | All moment routes require auth; login/signup pages are public                    |
| AUTH-05 | Account settings (minimal) | Logout + display email                                                       | Settings page shows account email and logout button                              |

### Capture

| ID     | Title                    | Description                                                              | Acceptance criteria                                                                   |
| ------ | ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| CAP-01 | Capture form UI          | Text input (required), date picker (default now), tag input, save button | Form validates required text; date defaults to now; mobile-friendly layout            |
| CAP-02 | Create moment API        | Persist moment with `body`, `occurred_at`, `user_id`                     | Moment saved to DB; returns created record                                            |
| CAP-03 | Tag assignment on create | Create new tags or link existing tags when saving                        | Tags created if new; duplicates reuse existing tag (case-insensitive)                 |
| CAP-04 | Media upload             | Up to five ordered photos, videos, or audio clips                        | Files upload to private storage; count, type, per-file, and combined limits validated |
| CAP-05 | Fast-save UX             | Minimal steps, clear success feedback, redirect to timeline or detail    | Happy path completable in <30s; loading/error states handled                          |

### Timeline

| ID    | Title               | Description                                  | Acceptance criteria                                                      |
| ----- | ------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| TL-01 | Timeline list UI    | Reverse-chronological feed of user's moments | Sorted by `occurred_at` desc; shows date, text preview, tags, media icon |
| TL-02 | Timeline data fetch | Paginated or infinite-scroll query           | Performs well with 100+ moments; only fetches current user's data        |
| TL-03 | Empty state         | Friendly message when no moments exist       | CTA to capture first moment                                              |
| TL-04 | Navigate to detail  | Tap/click row opens moment detail            | Correct moment loaded by id                                              |
| TL-05 | Favorite moments    | Toggle a favorite marker and filter timeline | Favorite works with keyword and tag filters; cards show favorite state   |

### Moment Detail

| ID     | Title              | Description                                          | Acceptance criteria                                      |
| ------ | ------------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| DET-01 | Detail view UI     | Full body, occurred date, tags, media player/display | Renders text and attachment by type (image/video/audio)  |
| DET-02 | Edit moment        | Inline or form-based edit for text, date, tags       | Changes persist; `updated_at` refreshed                  |
| DET-03 | Edit/replace media | Change or remove attachment                          | Old file deleted from storage when replaced/removed      |
| DET-04 | Delete moment      | Confirm then delete moment + attachment + tag links  | Moment gone from timeline and search; storage cleaned up |
| DET-05 | Signed media URLs  | Serve attachments via short-lived signed URLs        | Media not publicly listable; URLs expire                 |

### Search

| ID      | Title            | Description                                       | Acceptance criteria                                    |
| ------- | ---------------- | ------------------------------------------------- | ------------------------------------------------------ |
| SRCH-01 | Search UI        | Search input + optional tag filter chips/dropdown | Accessible from timeline; clear/reset filters          |
| SRCH-02 | Keyword search   | Match against moment `body`                       | Case-insensitive; results ranked by `occurred_at` desc |
| SRCH-03 | Tag filter       | Filter moments by one or more tags                | Match-any semantics for MVP                            |
| SRCH-04 | Combined search  | Keyword + tags applied together                   | AND logic between keyword and tag filters              |
| SRCH-05 | No-results state | Message when nothing matches                      | Suggests broadening search                             |

### Cross-cutting / Quality

| ID    | Title              | Description                                                                  | Acceptance criteria                           |
| ----- | ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------- |
| QA-01 | Responsive layout  | Mobile-first responsive design                                               | Usable on phone and desktop widths            |
| QA-02 | Core tests         | Unit tests for search/tag logic; integration test for create→timeline→search | Tests pass in CI                              |
| QA-03 | HTTPS & encryption | Deploy with TLS; use encrypted storage                                       | Documented in README; no secrets in repo      |
| QA-04 | Error handling     | Graceful errors for network, auth expiry, upload failures                    | User sees actionable messages, not raw errors |

---

## Out of scope (do not create tickets yet)

- Streaks, daily prompts, reminders
- Mood/habit tracking, wellness scoring
- Social feed, sharing, following
- AI insights or coaching
- Native mobile apps
- Payments/subscriptions
- "On this day", yearly recap, voice-to-text
