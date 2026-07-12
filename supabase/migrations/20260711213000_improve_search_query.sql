-- More forgiving keyword parsing and one RPC path for all Find filters.

create or replace function public.make_moment_search_tsquery(p_query text)
returns tsquery
language plpgsql
immutable
set search_path = public
as $$
declare
  cleaned text := trim(coalesce(p_query, ''));
  parsed tsquery;
begin
  if cleaned = '' then
    return null;
  end if;

  begin
    parsed := websearch_to_tsquery('english', cleaned);
  exception
    when others then
      parsed := plainto_tsquery('english', cleaned);
  end;

  if parsed is null or parsed = ''::tsquery then
    return plainto_tsquery('english', cleaned);
  end if;

  return parsed;
end;
$$;

create or replace function public.search_moment_ids(
  p_query text default '',
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
  with search_query as (
    select public.make_moment_search_tsquery(p_query) as tsq
  )
  select
    m.id,
    case
      when sq.tsq is null then 0::real
      else ts_rank_cd(m.search_vector, sq.tsq, 32)
    end as rank
  from public.moments m
  cross join search_query sq
  where
    (
      sq.tsq is null
      or m.search_vector @@ sq.tsq
    )
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

revoke all on function public.make_moment_search_tsquery(text) from public;
grant execute on function public.make_moment_search_tsquery(text) to authenticated;

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
