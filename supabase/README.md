# Supabase migrations

SQL migrations for the Moment Keeper database schema.

## Apply the schema (dashboard)

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → **New query**.
3. Copy the contents of [`migrations/20260707143000_initial_schema.sql`](migrations/20260707143000_initial_schema.sql).
4. Click **Run**.
5. Also run later migrations in order through [`migrations/20260711213000_improve_search_query.sql`](migrations/20260711213000_improve_search_query.sql).

You should see success with no errors. The initial migration creates:

- `profiles`, `moments`, `tags`, `moment_tags`, `media_attachments`
- Row Level Security policies (users only access their own data)
- A private `moment-media` storage bucket

## Apply with Supabase CLI (optional)

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Verify

In the dashboard:

- **Table Editor** — confirm the five tables exist
- **Storage** — confirm a private `moment-media` bucket exists
- **Authentication → Policies** — RLS enabled on all app tables

## Schema reference

See [`docs/data-model.md`](../docs/data-model.md) for field descriptions and relationships.
