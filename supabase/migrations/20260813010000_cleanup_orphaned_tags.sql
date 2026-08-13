-- Remove tags after their final moment is permanently deleted.

create or replace function public.cleanup_orphaned_tags(
  p_tag_ids uuid[] default null
)
returns table (tag_id uuid)
language sql
volatile
security invoker
set search_path = public
as $$
  delete from public.tags as tag
  where tag.user_id = auth.uid()
    and (p_tag_ids is null or tag.id = any(p_tag_ids))
    and not exists (
      select 1
      from public.moment_tags as link
      where link.tag_id = tag.id
    )
  returning tag.id;
$$;

revoke all on function public.cleanup_orphaned_tags(uuid[]) from public;
grant execute on function public.cleanup_orphaned_tags(uuid[]) to authenticated;

-- Clear orphaned tags created before permanent-delete cleanup was introduced.
delete from public.tags as tag
where not exists (
  select 1
  from public.moment_tags as link
  where link.tag_id = tag.id
);
