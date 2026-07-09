-- Full-text keyword search with relevance ranking.
-- Uses the existing moments.search_vector GIN index.

create or replace function public.search_moment_ids(
  p_query text,
  p_tag_ids uuid[] default null,
  p_limit int default 21,
  p_offset int default 0
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

revoke all on function public.search_moment_ids(text, uuid[], int, int) from public;
grant execute on function public.search_moment_ids(text, uuid[], int, int) to authenticated;
