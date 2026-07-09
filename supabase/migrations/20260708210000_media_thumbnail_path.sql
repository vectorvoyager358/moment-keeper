-- Add optional thumbnail path for photo attachments (timeline previews).

alter table public.media_attachments
  add column if not exists thumbnail_path text;

comment on column public.media_attachments.thumbnail_path is
  'Optional storage path for a JPEG thumbnail (photos only).';
