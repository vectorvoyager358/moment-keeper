-- Favorite moments and keep favorite filtering inside ranked search.

alter table public.moments
  add column is_favorite boolean not null default false;

create index moments_user_favorites_occurred_at_idx
  on public.moments (user_id, occurred_at desc)
  where is_favorite;

drop function if exists public.search_moment_ids(text, uuid[], integer, integer);

create function public.search_moment_ids(
  p_query text,
  p_tag_ids uuid[] default null,
  p_limit integer default 21,
  p_offset integer default 0,
  p_favorite_only boolean default false
)
returns table (
  id uuid,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.id,
    ts_rank(
      m.search_vector,
      plainto_tsquery('english', p_query)
    ) as rank
  from public.moments m
  where
    length(trim(p_query)) > 0
    and m.search_vector @@ plainto_tsquery('english', p_query)
    and (not p_favorite_only or m.is_favorite)
    and (
      p_tag_ids is null
      or cardinality(p_tag_ids) = 0
      or exists (
        select 1
        from public.moment_tags mt
        where mt.moment_id = m.id
          and mt.tag_id = any (p_tag_ids)
      )
    )
  order by rank desc, m.occurred_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.search_moment_ids(
  text,
  uuid[],
  integer,
  integer,
  boolean
) from public;

grant execute on function public.search_moment_ids(
  text,
  uuid[],
  integer,
  integer,
  boolean
) to authenticated;
