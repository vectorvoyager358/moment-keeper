-- New accounts choose a display name during signup (stored in auth metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_name text;
begin
  signup_name := nullif(btrim(new.raw_user_meta_data->>'display_name'), '');

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, signup_name);

  return new;
end;
$$;
