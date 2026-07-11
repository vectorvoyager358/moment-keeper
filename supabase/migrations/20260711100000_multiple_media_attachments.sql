-- Allow up to five ordered media attachments per moment.

alter table public.media_attachments
  drop constraint if exists media_attachments_moment_id_key;

alter table public.media_attachments
  add column display_order smallint not null default 0,
  add constraint media_attachments_display_order_check
    check (display_order >= 0 and display_order < 5);

create unique index media_attachments_moment_display_order_idx
  on public.media_attachments (moment_id, display_order);
