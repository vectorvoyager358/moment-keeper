-- Allow users to reorder a moment's attachments in one atomic operation.

drop index if exists public.media_attachments_moment_display_order_idx;

alter table public.media_attachments
  drop constraint if exists media_attachments_moment_display_order_key;

alter table public.media_attachments
  add constraint media_attachments_moment_display_order_key
  unique (moment_id, display_order)
  deferrable initially immediate;

create or replace function public.reorder_moment_media(
  p_moment_id uuid,
  p_attachment_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  attachment_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if cardinality(p_attachment_ids) > 5 then
    raise exception 'A moment can have at most five attachments';
  end if;

  if cardinality(p_attachment_ids) <> (
    select count(distinct requested.id)
    from unnest(p_attachment_ids) as requested(id)
  ) then
    raise exception 'Attachment order contains duplicates';
  end if;

  select count(*)
  into attachment_count
  from public.media_attachments
  where moment_id = p_moment_id
    and user_id = auth.uid();

  if attachment_count <> cardinality(p_attachment_ids) then
    raise exception 'Attachment order must include every attachment';
  end if;

  if exists (
    select 1
    from unnest(p_attachment_ids) as requested(id)
    left join public.media_attachments as attachment
      on attachment.id = requested.id
      and attachment.moment_id = p_moment_id
      and attachment.user_id = auth.uid()
    where attachment.id is null
  ) then
    raise exception 'Attachment order contains invalid media';
  end if;

  set constraints media_attachments_moment_display_order_key deferred;

  update public.media_attachments as attachment
  set display_order = requested.position - 1
  from unnest(p_attachment_ids) with ordinality as requested(id, position)
  where attachment.id = requested.id
    and attachment.moment_id = p_moment_id
    and attachment.user_id = auth.uid();
end;
$$;

revoke all on function public.reorder_moment_media(uuid, uuid[]) from public;
grant execute on function public.reorder_moment_media(uuid, uuid[])
  to authenticated;
