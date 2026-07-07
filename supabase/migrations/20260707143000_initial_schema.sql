-- Moment Keeper initial schema (AUTH-03)
-- Apply via Supabase SQL Editor or: supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.media_type as enum ('photo', 'video', 'audio');

-- ---------------------------------------------------------------------------
-- Profiles (maps to User in docs/data-model.md; auth.users is managed by Supabase)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Moments
-- ---------------------------------------------------------------------------
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (to_tsvector('english', body)) stored,
  constraint moments_body_length_check check (
    char_length(body) >= 1
    and char_length(body) <= 10000
  ),
  constraint moments_occurred_at_not_far_future_check check (
    occurred_at <= now() + interval '1 hour'
  )
);

create index moments_user_occurred_at_idx
  on public.moments (user_id, occurred_at desc);

create index moments_search_vector_idx
  on public.moments using gin (search_vector);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_length_check check (char_length(trim(name)) >= 1)
);

create unique index tags_user_id_name_lower_idx
  on public.tags (user_id, lower(trim(name)));

-- ---------------------------------------------------------------------------
-- Moment ↔ Tag join
-- ---------------------------------------------------------------------------
create table public.moment_tags (
  moment_id uuid not null references public.moments (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, tag_id)
);

create index moment_tags_tag_id_idx on public.moment_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Media attachments (one per moment in MVP)
-- ---------------------------------------------------------------------------
create table public.media_attachments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null unique references public.moments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  media_type public.media_type not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  original_filename text,
  created_at timestamptz not null default now(),
  constraint media_attachments_file_size_check check (file_size_bytes > 0)
);

create index media_attachments_user_id_idx on public.media_attachments (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger moments_set_updated_at
  before update on public.moments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users created before this migration
insert into public.profiles (id, email, display_name)
select
  id,
  email,
  split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Enforce media_attachments.user_id matches parent moment
-- ---------------------------------------------------------------------------
create or replace function public.enforce_media_attachment_user_id()
returns trigger
language plpgsql
as $$
declare
  moment_owner uuid;
begin
  select user_id into moment_owner
  from public.moments
  where id = new.moment_id;

  if moment_owner is null then
    raise exception 'Moment not found for media attachment';
  end if;

  new.user_id = moment_owner;
  return new;
end;
$$;

create trigger media_attachments_set_user_id
  before insert or update on public.media_attachments
  for each row execute function public.enforce_media_attachment_user_id();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.moments enable row level security;
alter table public.tags enable row level security;
alter table public.moment_tags enable row level security;
alter table public.media_attachments enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- moments
create policy "Users can view own moments"
  on public.moments for select
  using (auth.uid() = user_id);

create policy "Users can insert own moments"
  on public.moments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own moments"
  on public.moments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own moments"
  on public.moments for delete
  using (auth.uid() = user_id);

-- tags
create policy "Users can view own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tags"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.tags for delete
  using (auth.uid() = user_id);

-- moment_tags
create policy "Users can view own moment tags"
  on public.moment_tags for select
  using (
    exists (
      select 1
      from public.moments m
      where m.id = moment_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users can insert own moment tags"
  on public.moment_tags for insert
  with check (
    exists (
      select 1
      from public.moments m
      where m.id = moment_id
        and m.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.tags t
      where t.id = tag_id
        and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own moment tags"
  on public.moment_tags for delete
  using (
    exists (
      select 1
      from public.moments m
      where m.id = moment_id
        and m.user_id = auth.uid()
    )
  );

-- media_attachments
create policy "Users can view own media attachments"
  on public.media_attachments for select
  using (auth.uid() = user_id);

create policy "Users can insert own media attachments"
  on public.media_attachments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.moments m
      where m.id = moment_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users can update own media attachments"
  on public.media_attachments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own media attachments"
  on public.media_attachments for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Private storage bucket for moment media
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('moment-media', 'moment-media', false)
on conflict (id) do nothing;

create policy "Users can upload own moment media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'moment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own moment media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'moment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own moment media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'moment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'moment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own moment media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'moment-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
