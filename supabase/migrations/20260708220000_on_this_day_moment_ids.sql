-- Moments from the same calendar month/day in prior years ("On this day").
-- Uses UTC date parts for consistent matching with stored timestamptz values.

create or replace function public.on_this_day_moment_ids(
  p_month int,
  p_day int,
  p_year int,
  p_limit int default 12
)
returns table (
  id uuid,
  occurred_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.id,
    m.occurred_at
  from public.moments m
  where
    extract(month from m.occurred_at at time zone 'utc') = p_month
    and extract(day from m.occurred_at at time zone 'utc') = p_day
    and extract(year from m.occurred_at at time zone 'utc') < p_year
  order by m.occurred_at desc
  limit greatest(p_limit, 0);
$$;

revoke all on function public.on_this_day_moment_ids(int, int, int, int) from public;
grant execute on function public.on_this_day_moment_ids(int, int, int, int) to authenticated;
