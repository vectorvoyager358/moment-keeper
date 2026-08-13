-- Keep deleted moments recoverable for a short client-side undo window.

alter table public.moments
  add column if not exists deleted_at timestamptz;

create index if not exists moments_user_deleted_at_idx
  on public.moments (user_id, deleted_at)
  where deleted_at is not null;

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
  where m.deleted_at is null
    and (
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
  order by rank desc, m.occurred_at desc, m.id desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

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
  where m.deleted_at is null
    and extract(month from m.occurred_at at time zone p_timezone) = p_month
    and extract(day from m.occurred_at at time zone p_timezone) = p_day
    and extract(year from m.occurred_at at time zone p_timezone) < p_year
  order by m.occurred_at desc
  limit greatest(p_limit, 0);
$$;

create or replace function public.resurface_moment_ids(
  p_themes public.memory_theme[],
  p_media_type public.media_type default null,
  p_limit integer default 6
)
returns table (
  id uuid,
  match_source text,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with theme_terms as (
    select case requested_theme
      when 'joy'::public.memory_theme then
        'joy | joyful | happy | happiness | smile | laugh | fun | delight'
      when 'achievement'::public.memory_theme then
        'achieve | complete | finish | win | won | promote | proud | milestone | success'
      when 'growth'::public.memory_theme then
        'recover | recovery | heal | overcome | progress | learn | stronger | resilient'
      when 'gratitude'::public.memory_theme then
        'grateful | gratitude | thankful | appreciate | blessing | fortunate'
      when 'connection'::public.memory_theme then
        'family | friend | together | love | support | kindness | relationship'
      when 'adventure'::public.memory_theme then
        'adventure | travel | trip | explore | hike | journey | discover | visit'
      when 'calm'::public.memory_theme then
        'calm | peaceful | quiet | relax | rest | gentle | still | serene'
    end as terms
    from unnest(coalesce(p_themes, '{}')) as requested_theme
  ),
  content_query as (
    select case
      when count(*) = 0 then null
      else to_tsquery('english', string_agg('(' || terms || ')', ' | '))
    end as query
    from theme_terms
  ),
  matches as (
    select
      moments.id,
      case
        when moments.themes && p_themes then 'theme'
        else 'content'
      end as match_source,
      case
        when moments.themes && p_themes then 2.0::real
        else ts_rank(moments.search_vector, content_query.query)
      end as rank,
      moments.occurred_at
    from public.moments
    cross join content_query
    where moments.user_id = auth.uid()
      and moments.deleted_at is null
      and cardinality(coalesce(p_themes, '{}')) > 0
      and (
        moments.themes && p_themes
        or (
          content_query.query is not null
          and moments.search_vector @@ content_query.query
        )
      )
      and (
        p_media_type is null
        or exists (
          select 1
          from public.media_attachments
          where media_attachments.moment_id = moments.id
            and media_attachments.media_type = p_media_type
        )
      )
  )
  select matches.id, matches.match_source, matches.rank
  from matches
  order by
    (matches.match_source = 'theme') desc,
    matches.rank desc,
    matches.occurred_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;
