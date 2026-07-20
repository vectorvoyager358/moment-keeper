alter table public.moments
  add column link_url text;

alter table public.moments
  add constraint moments_link_url_length_check
  check (link_url is null or char_length(link_url) between 1 and 2048),
  add constraint moments_link_url_scheme_check
  check (link_url is null or link_url ~* '^https?://');

comment on column public.moments.link_url is
  'Optional normalized HTTP(S) webpage attached to a moment.';

alter table public.moments
  drop column search_vector;

alter table public.moments
  add column search_vector tsvector generated always as (
    to_tsvector(
      'english',
      body || coalesce(' ' || nullif(trim(location), ''), '')
    ) ||
    to_tsvector('simple', coalesce(link_url, ''))
  ) stored;

create index moments_search_vector_idx
  on public.moments using gin (search_vector);
