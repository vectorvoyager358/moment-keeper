-- Structured memory themes and privacy-first resurfacing.

create type public.memory_theme as enum (
  'joy',
  'achievement',
  'growth',
  'gratitude',
  'connection',
  'adventure',
  'calm'
);

alter table public.moments
  add column themes public.memory_theme[] not null default '{}',
  add constraint moments_themes_limit_check
    check (cardinality(themes) <= 3),
  add constraint moments_themes_no_nulls_check
    check (array_position(themes, null) is null);

create index moments_themes_idx
  on public.moments using gin (themes);

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

revoke all on function public.resurface_moment_ids(
  public.memory_theme[],
  public.media_type,
  integer
) from public;

grant execute on function public.resurface_moment_ids(
  public.memory_theme[],
  public.media_type,
  integer
) to authenticated;
