-- Optional free-text location on moments; included in full-text search.

alter table public.moments
  add column location text;

alter table public.moments
  add constraint moments_location_length_check check (
    location is null
    or (
      char_length(trim(location)) >= 1
      and char_length(location) <= 200
    )
  );

alter table public.moments drop column search_vector;

alter table public.moments
  add column search_vector tsvector generated always as (
    to_tsvector(
      'english',
      body || coalesce(' ' || nullif(trim(location), ''), '')
    )
  ) stored;

create index moments_search_vector_idx
  on public.moments using gin (search_vector);
