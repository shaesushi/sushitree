-- Tabela de fotos individuais por imóvel 360°
create table if not exists public.property_360_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties_360(id) on delete cascade,
  image_url   text not null,
  label       text not null default '',
  position    integer not null default 0,
  created_at  timestamptz default now()
);

alter table public.property_360_images enable row level security;

create policy "Public read property_360_images"
  on public.property_360_images for select using (true);

create policy "Auth all property_360_images"
  on public.property_360_images for all using (auth.role() = 'authenticated');

-- Remove coluna de imagem única (foi substituída pela tabela acima)
alter table public.properties_360 drop column if exists image_360_url;
