-- Allow profile upsert when a row is missing (e.g. pre-trigger accounts).
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Backfill display names that were never set.
update public.profiles
set display_name = left(trim(split_part(email, '@', 1)), 20)
where display_name is null or btrim(display_name) = '';
