-- Tabela de imóveis com visualização 360°
create table if not exists public.properties_360 (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  thumbnail_url  text,
  image_360_url  text,
  external_url   text,
  position     integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz default now()
);

alter table public.properties_360 enable row level security;

create policy "Public read properties_360"
  on public.properties_360 for select using (true);

create policy "Auth all properties_360"
  on public.properties_360 for all using (auth.role() = 'authenticated');
