# Data Model — Moment Keeper

Source of truth for entities, fields, and relationships. Update this file whenever the schema changes.

## Overview

```
User 1──* Moment *──* Tag (via MomentTag)
              │
              └──0..5 MediaAttachment
```

All tables are scoped to a single `user_id`. No sharing or multi-user access.

Reads hide moments with `deleted_at` set. Permanent delete removes the row, its media, and unused tags.

---

## User

Represents an authenticated account. Managed by Supabase Auth (`auth.users`). App data references `auth.users.id` as `user_id`.

The `profiles` table stores app-level user fields:

| Field          | Type      | Notes                                                                            |
| -------------- | --------- | -------------------------------------------------------------------------------- |
| `id`           | UUID      | Primary key; FK → `auth.users.id`                                                |
| `email`        | string    | Copied from auth on sign-up                                                      |
| `display_name` | string    | Required in the product; max 20 characters; set at signup or `/settings?setup=1` |
| `created_at`   | timestamp | Profile creation                                                                 |
| `updated_at`   | timestamp | Last profile change                                                              |

A trigger creates a `profiles` row on sign-up and copies `display_name` from auth metadata when present. Existing accounts without a name are sent to account setup before they can use the journal.

---

## Moment

A single captured life moment. Plain-text `body` is required; rich text, media, location, and a link are optional.

| Field           | Type             | Notes                                                                                              |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `id`            | UUID             | Primary key                                                                                        |
| `user_id`       | UUID             | FK → User; indexed                                                                                 |
| `body`          | text             | Required plain-text description; 1–10,000 characters; used for search                              |
| `body_content`  | jsonb            | Optional Tiptap document (`{ "type": "doc", ... }`); max ~100 KB; `body` stays the searchable text |
| `location`      | text             | Optional free-text place; 1–200 characters when set                                                |
| `link_url`      | text             | Optional `http(s)` URL; 1–2048 characters                                                          |
| `themes`        | `memory_theme[]` | Up to three system themes; empty for unclassified moments                                          |
| `is_favorite`   | boolean          | User-controlled favorite marker; defaults to `false`                                               |
| `deleted_at`    | timestamp        | Soft-delete timestamp; `null` while the moment is visible                                          |
| `occurred_at`   | timestamp        | When the moment happened; user-editable; defaults to `created_at`                                  |
| `created_at`    | timestamp        | When the record was saved                                                                          |
| `updated_at`    | timestamp        | Last edit                                                                                          |
| `search_vector` | tsvector         | Generated from `body`, `location`, and `link_url`                                                  |

**Indexes:**

- `(user_id, occurred_at DESC, id DESC)` — timeline feed and keyset pagination
- GIN index on `search_vector` — keyword search
- GIN index on `themes` — structured memory resurfacing
- Partial `(user_id, occurred_at DESC)` index for favorite moments
- Partial `(user_id, deleted_at)` index for soft-deleted rows

**Validation:**

- `body` required, 1–10,000 characters
- `occurred_at` may be in the past; not more than 1 hour in the future
- `link_url` must be `http://` or `https://` when set

### Soft delete

`deleteMoment` sets `deleted_at` and hides the row from journal, search, browse, and resurfacing. The client can undo for 10 seconds (`MOMENT_DELETE_UNDO_MS`) by clearing `deleted_at`. After that window — or on stale cleanup (~5 minutes) — the row is permanently deleted, attachments are removed from storage, and `cleanup_orphaned_tags` drops tags that no longer have any moments.

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

**Orphans:** `cleanup_orphaned_tags(p_tag_ids?)` deletes the current user's tags that have no `moment_tags` rows. Called after a moment is permanently deleted.

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

Up to five ordered photo, video, or audio files per moment.

| Field               | Type      | Notes                                              |
| ------------------- | --------- | -------------------------------------------------- |
| `id`                | UUID      | Primary key                                        |
| `moment_id`         | UUID      | FK → Moment                                        |
| `user_id`           | UUID      | FK → User; denormalized for storage path scoping   |
| `media_type`        | enum      | `photo` \| `video` \| `audio`                      |
| `display_order`     | smallint  | Stable order from `0` to `4`; unique per moment    |
| `storage_path`      | string    | Path/key in object storage (not a public URL)      |
| `thumbnail_path`    | string    | Optional JPEG preview path (photos; video posters) |
| `mime_type`         | string    | e.g. `image/jpeg`, `video/mp4`, `audio/mpeg`       |
| `file_size_bytes`   | integer   | For display / upload limits                        |
| `original_filename` | string    | Optional; for download display                     |
| `created_at`        | timestamp |                                                    |

**Upload limits:**

- Combined upload: 50 MB across up to five attachments
- Photo: 10 MB
- Video: 50 MB
- Audio: 25 MB

**Client prep (capture / edit):** JPEG/PNG/WebP photos ≥ ~300 KB are downscaled (max edge 1920px) and re-encoded as JPEG before upload. GIFs, video, and audio are left unchanged. Existing attachments can be removed or reordered; `reorder_moment_media` updates `display_order` atomically.

**Storage layout:** `{user_id}/{moment_id}/{attachment_id}.{ext}`  
**Thumbnails:** `{user_id}/{moment_id}/{attachment_id}.thumb.jpg` — photos via `sharp` on upload (max edge 480px); videos may store a client-generated poster. Audio has no thumbnail.

**Access:** private `moment-media` bucket; clients receive signed URLs (1 hour TTL).

---

## Search (query model, not a table)

Search is a read over `Moment` + `MomentTag` + `Tag`. Soft-deleted moments are excluded.

| Input    | Behavior                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Keyword  | Postgres full-text on `search_vector` via `search_moment_ids` (`make_moment_search_tsquery` + `ts_rank_cd`) |
| Tag(s)   | Match any selected tag                                                                                      |
| Favorite | Optional `p_favorite_only` filter                                                                           |
| Combined | Keyword AND tag AND favorite filters applied together                                                       |

Keyword results sorted by rank DESC, then `occurred_at` DESC, then `id` DESC. Tag-only / unfiltered timeline stays `occurred_at` DESC, `id` DESC.

### On this day (resurfacing)

Read operation via `on_this_day_moment_ids`:

| Input                   | Behavior                                         |
| ----------------------- | ------------------------------------------------ |
| Viewer's month/day      | Match `occurred_at` in the request IANA timezone |
| Current year in that TZ | Exclude moments from the current year            |
| Limit                   | Default 12, newest `occurred_at` first           |

Shown on `/timeline` when no search filters are active.

### Theme and content resurfacing

`memory_theme` is a fixed system vocabulary: `joy`, `achievement`, `growth`,
`gratitude`, `connection`, `adventure`, and `calm`. A moment can have zero to
three themes; these are separate from user-defined tags.

`resurface_moment_ids` accepts one or more themes plus an optional media type.
It ranks explicit theme matches first, then falls back to curated full-text
terms over the moment body. This provides private, no-AI content matching while
keeping the retrieval layer ready for semantic embeddings later.

---

## Database functions

| Function                 | Role                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `search_moment_ids`      | Ranked keyword / tag / favorite search                           |
| `on_this_day_moment_ids` | Same calendar day in prior years, timezone-aware                 |
| `resurface_moment_ids`   | Theme + optional media-type resurfacing                          |
| `reorder_moment_media`   | Atomic `display_order` update for a moment's attachments         |
| `cleanup_orphaned_tags`  | Delete the current user's tags that no longer link to any moment |

---

## Security & privacy notes

- Row-level security: every query filtered by `user_id` from the authenticated session.
- Media files in a private bucket; served via short-lived signed URLs only.
- Encryption at rest: provided by managed DB + object storage; HTTPS for transit.
- No E2E encryption.
