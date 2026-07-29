alter table public.moments
add column if not exists body_content jsonb;

alter table public.moments
drop constraint if exists moments_body_content_shape_check;

alter table public.moments
add constraint moments_body_content_shape_check check (
  body_content is null
  or (
    jsonb_typeof(body_content) = 'object'
    and body_content ->> 'type' = 'doc'
    and octet_length(body_content::text) <= 100000
  )
);

comment on column public.moments.body_content is
  'Optional structured Tiptap JSON. The body column remains the searchable plain-text representation.';
