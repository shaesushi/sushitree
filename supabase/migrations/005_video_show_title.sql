alter table public.videos
  add column if not exists show_title boolean not null default true;
