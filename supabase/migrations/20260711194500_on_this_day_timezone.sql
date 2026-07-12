-- Match "on this day" using the viewer's IANA timezone instead of UTC.

create or replace function public.on_this_day_moment_ids(
  p_month int,
  p_day int,
  p_year int,
  p_limit int default 12,
  p_timezone text default 'UTC'
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
    extract(month from m.occurred_at at time zone p_timezone) = p_month
    and extract(day from m.occurred_at at time zone p_timezone) = p_day
    and extract(year from m.occurred_at at time zone p_timezone) < p_year
  order by m.occurred_at desc
  limit greatest(p_limit, 0);
$$;
