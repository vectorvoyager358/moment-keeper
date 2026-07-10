# Data Model — Moment Keeper (MVP)

Source of truth for entities, fields, and relationships. Update this file whenever the schema changes.

## Overview

```
User 1──* Moment *──* Tag (via MomentTag)
              │
              └──0..1 MediaAttachment
```

All tables are scoped to a single `user_id`. No sharing or multi-user access in MVP.

---

## User

Represents an authenticated account. Managed by Supabase Auth (`auth.users`). App data references `auth.users.id` as `user_id`.

The `profiles` table stores app-level user fields:

| Field          | Type      | Notes                                  |
| -------------- | --------- | -------------------------------------- |
| `id`           | UUID      | Primary key; FK → `auth.users.id`      |
| `email`        | string    | Copied from auth on sign-up            |
| `display_name` | string    | Optional; defaults to email local-part |
| `created_at`   | timestamp | Profile creation                       |
| `updated_at`   | timestamp | Last profile change                    |

A trigger creates a `profiles` row automatically when a user signs up.

---

## Moment

A single captured life moment. Text is required; media is optional.

| Field         | Type             | Notes                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------- |
| `id`          | UUID             | Primary key                                                       |
| `user_id`     | UUID             | FK → User; indexed                                                |
| `body`        | text             | Required; the moment description (min 1 char)                     |
| `themes`      | `memory_theme[]` | Up to three system themes; empty for unclassified moments         |
| `occurred_at` | timestamp        | When the moment happened; user-editable; defaults to `created_at` |
| `created_at`  | timestamp        | When the record was saved                                         |
| `updated_at`  | timestamp        | Last edit                                                         |

**Indexes:**

- `(user_id, occurred_at DESC)` — timeline feed
- Full-text index on `body` — keyword search (e.g. Postgres `tsvector`)
- GIN index on `themes` — structured memory resurfacing

**Validation:**

- `body` required, max length TBD (suggest 10,000 chars for MVP)
- `occurred_at` may be in the past (backdating); not in the future beyond a small tolerance (e.g. +1 hour for clock skew)

---

## Tag

User-defined labels for organizing and filtering moments. No fixed taxonomy.

| Field        | Type      | Notes                                            |
| ------------ | --------- | ------------------------------------------------ |
| `id`         | UUID      | Primary key                                      |
| `user_id`    | UUID      | FK → User                                        |
| `name`       | string    | Display name; unique per user (case-insensitive) |
| `created_at` | timestamp |                                                  |

**Indexes:**

- `(user_id, lower(name))` UNIQUE — prevent duplicate tags like "Work" and "work"

**Normalization:** trim whitespace; store display casing as entered.

---

## MomentTag

Join table linking moments to tags (many-to-many).

| Field        | Type      | Notes       |
| ------------ | --------- | ----------- |
| `moment_id`  | UUID      | FK → Moment |
| `tag_id`     | UUID      | FK → Tag    |
| `created_at` | timestamp |             |

**Primary key:** `(moment_id, tag_id)`

**Cascade:** deleting a moment removes its tag links; deleting a tag removes links but not moments.

---

## MediaAttachment

Optional single photo, video, or audio file per moment (MVP: max one attachment).

| Field               | Type      | Notes                                                  |
| ------------------- | --------- | ------------------------------------------------------ |
| `id`                | UUID      | Primary key                                            |
| `moment_id`         | UUID      | FK → Moment; UNIQUE (one attachment per moment in MVP) |
| `user_id`           | UUID      | FK → User; denormalized for storage path scoping       |
| `media_type`        | enum      | `photo` \| `video` \| `audio`                          |
| `storage_path`      | string    | Path/key in object storage (not a public URL)          |
| `thumbnail_path`    | string    | Optional JPEG thumbnail path for timeline previews     |
| `mime_type`         | string    | e.g. `image/jpeg`, `video/mp4`, `audio/mpeg`           |
| `file_size_bytes`   | integer   | For display / upload limits                            |
| `original_filename` | string    | Optional; for download display                         |
| `created_at`        | timestamp |                                                        |

**MVP upload limits (suggested):**

- Photo: 10 MB
- Video: 50 MB
- Audio: 25 MB

**Client prep (capture / edit):** JPEG/PNG/WebP photos ≥ ~300 KB are downscaled (max edge 1920px) and re-encoded as JPEG before upload. GIFs, video, and audio are left unchanged.

**Storage layout (suggested):** `{user_id}/{moment_id}/{attachment_id}.{ext}`  
**Thumbnails (photos):** `{user_id}/{moment_id}/{attachment_id}.thumb.jpg` generated with `sharp` on upload (max edge 480px). Video/audio have no thumbnail yet.

---

## Search (query model, not a table)

MVP search is a read operation over `Moment` + `MomentTag` + `Tag`:

| Input    | Behavior                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------- |
| Keyword  | Postgres full-text on `search_vector` via `search_moment_ids` RPC (`plainto_tsquery` + `ts_rank`) |
| Tag(s)   | Filter moments linked to any/all selected tags (MVP: match any tag)                               |
| Combined | Keyword AND tag filters applied together                                                          |

Keyword results sorted by `ts_rank` DESC, then `occurred_at` DESC. Tag-only / unfiltered timeline stays `occurred_at` DESC.

### On this day (resurfacing)

Read operation via `on_this_day_moment_ids` RPC:

| Input                 | Behavior                                |
| --------------------- | --------------------------------------- |
| Today's UTC month/day | Match `occurred_at` month and day (UTC) |
| Current UTC year      | Exclude moments from the current year   |
| Limit                 | Default 12, newest `occurred_at` first  |

Shown on `/timeline` when no search filters are active. Requires migration `20260708220000_on_this_day_moment_ids.sql`.

### Theme and content resurfacing

`memory_theme` is a fixed system vocabulary: `joy`, `achievement`, `growth`,
`gratitude`, `connection`, `adventure`, and `calm`. A moment can have zero to
three themes; these are separate from user-defined tags.

`resurface_moment_ids` accepts one or more themes plus an optional media type.
It ranks explicit theme matches first, then falls back to curated full-text
terms over the moment body. This provides private, no-AI content matching while
keeping the retrieval layer ready for semantic embeddings later.

---

## Security & privacy notes

- Row-level security: every query filtered by `user_id` from the authenticated session.
- Media files in private buckets; served via short-lived signed URLs only.
- Encryption at rest: provided by managed DB + object storage; HTTPS for transit.
- No E2E encryption in MVP (see product brief).
