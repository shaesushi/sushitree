-- ═══════════════════════════════════════════════════════════════════════════
-- SHAE SUSHI — Setup completo do banco de dados
-- Execute uma vez no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. PROFILES (antes da função get_my_role) ───────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;


-- ─── 2. FUNÇÃO get_my_role (precisa de profiles criada primeiro) ──────────────
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;


-- ─── 3. POLICIES de PROFILES ─────────────────────────────────────────────────
create policy "profiles_select_own"   on public.profiles for select using (id = auth.uid());
create policy "profiles_select_admin" on public.profiles for select using (public.get_my_role() = 'admin');
create policy "profiles_update_own"   on public.profiles for update using (id = auth.uid());
create policy "profiles_update_admin" on public.profiles for update using (public.get_my_role() = 'admin');

-- Auto-cria perfil ao cadastrar usuário (primeiro usuário vira admin)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when user_count = 0 then 'admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 3. PAGE CONTENT (CMS) ───────────────────────────────────────────────────
create table if not exists public.page_content (
  id         uuid primary key default gen_random_uuid(),
  section    text not null,
  key        text not null,
  value      text,
  type       text not null default 'text' check (type in ('text', 'url', 'image', 'html')),
  label      text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  unique (section, key)
);

alter table public.page_content enable row level security;

create policy "content_select_public" on public.page_content for select using (true);
create policy "content_all_admin"     on public.page_content for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Conteúdo inicial — Shae Sushi
insert into public.page_content (section, key, value, type, label) values
  ('hero', 'name',         'SHAE SUSHI',                              'text',  'Nome principal'),
  ('hero', 'eyebrow',      'CULINÁRIA JAPONESA',                      'text',  'Eyebrow (acima do nome)'),
  ('hero', 'subtitle',     'Foz do Iguaçu · Delivery & Restaurante',  'text',  'Subtítulo'),
  ('hero', 'image_url',    '',                                        'image', 'Foto hero'),

  ('intro', 'headline',    'SABOR JAPONÊS AUTÊNTICO',                 'text',  'Título seção intro'),
  ('intro', 'subheadline', 'feito com ingredientes frescos',          'text',  'Subtítulo intro'),
  ('intro', 'description', 'Delivery e restaurante de comida japonesa em Foz do Iguaçu. Combinados, hot rolls, sashimis e muito mais com entrega rápida.',
                                                                      'text',  'Descrição intro'),

  ('links', 'whatsapp_number', '554599999999',                        'text',  'Número WhatsApp'),
  ('links', 'instagram_url',   'https://www.instagram.com/shaesushi', 'url',   'URL Instagram'),
  ('links', 'youtube_url',     'https://www.youtube.com/@shaesushi',  'url',   'URL YouTube'),
  ('links', 'email',           'contato@shaesushi.com.br',            'text',  'E-mail contato'),

  ('footer', 'copyright', '© 2026 · Shae Sushi · Todos os direitos reservados', 'text', 'Texto copyright'),

  ('cards', 'img_whatsapp',  '', 'image', 'Foto card WhatsApp'),
  ('cards', 'img_imoveis',   '', 'image', 'Foto card Cardápio'),
  ('cards', 'img_comprar',   '', 'image', 'Foto card Pedir'),
  ('cards', 'img_vender',    '', 'image', 'Foto card Reserva'),
  ('cards', 'img_instagram', '', 'image', 'Foto card Instagram'),
  ('cards', 'img_youtube',   '', 'image', 'Foto card YouTube')
on conflict (section, key) do nothing;


-- ─── 4. VIDEOS ───────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  youtube_url  text not null,
  thumbnail_url text,
  platform     text not null default 'youtube' check (platform in ('youtube', 'reels', 'tiktok')),
  mp4_url      text,
  external_url text,
  show_title   boolean not null default true,
  position     integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos_select_public" on public.videos for select using (active = true);
create policy "videos_select_admin"  on public.videos for select using (public.get_my_role() = 'admin');
create policy "videos_insert_admin"  on public.videos for insert with check (public.get_my_role() = 'admin');
create policy "videos_update_admin"  on public.videos for update using (public.get_my_role() = 'admin');
create policy "videos_delete_admin"  on public.videos for delete using (public.get_my_role() = 'admin');


-- ─── 5. PROPERTIES 360° ──────────────────────────────────────────────────────
create table if not exists public.properties_360 (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default '',
  show_title    boolean not null default true,
  thumbnail_url text,
  external_url  text,
  position      integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz default now()
);

alter table public.properties_360 enable row level security;

create policy "p360_select_public" on public.properties_360 for select using (true);
create policy "p360_all_auth"      on public.properties_360 for all using (auth.role() = 'authenticated');


-- ─── 6. PROPERTY 360° IMAGES ─────────────────────────────────────────────────
create table if not exists public.property_360_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties_360(id) on delete cascade,
  image_url   text not null,
  label       text not null default '',
  position    integer not null default 0,
  created_at  timestamptz default now()
);

alter table public.property_360_images enable row level security;

create policy "p360img_select_public" on public.property_360_images for select using (true);
create policy "p360img_all_auth"      on public.property_360_images for all using (auth.role() = 'authenticated');


-- ─── 7. CLICK EVENTS ─────────────────────────────────────────────────────────
create table if not exists public.click_events (
  id           uuid primary key default gen_random_uuid(),
  button_id    text not null,
  button_label text,
  href         text,
  session_id   text,
  page_url     text,
  referrer     text,
  user_agent   text,
  country      text,
  created_at   timestamptz not null default now()
);

alter table public.click_events enable row level security;

create policy "clicks_insert_any"   on public.click_events for insert with check (true);
create policy "clicks_select_admin" on public.click_events for select using (public.get_my_role() = 'admin');


-- ─── 8. PAGE VIEWS ───────────────────────────────────────────────────────────
create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  session_id text,
  referrer   text,
  user_agent text,
  country    text,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

create policy "pageviews_insert_any"   on public.page_views for insert with check (true);
create policy "pageviews_select_admin" on public.page_views for select using (public.get_my_role() = 'admin');


-- ─── 9. INTEGRATIONS ─────────────────────────────────────────────────────────
create table if not exists public.integrations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  type        text not null,
  value       text,
  enabled     boolean not null default false,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id)
);

alter table public.integrations enable row level security;

create policy "integrations_select_auth" on public.integrations for select using (auth.role() = 'authenticated');
create policy "integrations_all_admin"   on public.integrations for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

insert into public.integrations (name, type, value, enabled, description) values
  ('google_analytics',    'ga4',     '', false, 'Google Analytics 4 — Measurement ID (G-XXXXXXXXXX)'),
  ('google_tag_manager',  'gtm',     '', false, 'Google Tag Manager — Container ID (GTM-XXXXXXX)'),
  ('meta_pixel',          'pixel',   '', false, 'Meta Pixel (Facebook) — Pixel ID'),
  ('hotjar',              'hotjar',  '', false, 'Hotjar — Site ID'),
  ('microsoft_clarity',   'clarity', '', false, 'Microsoft Clarity — Project ID'),
  ('open_graph_title',    'og',      'Shae Sushi · Culinária Japonesa em Foz do Iguaçu', false, 'Open Graph — Título de compartilhamento'),
  ('open_graph_description','og',    'Delivery e restaurante japonês em Foz do Iguaçu. Combinados, hot rolls e sashimis.', false, 'Open Graph — Descrição'),
  ('open_graph_image',    'og',      '', false, 'Open Graph — URL da imagem de compartilhamento')
on conflict (name) do nothing;


-- ─── 10. STORAGE BUCKETS ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images',     'images',     true, 5242880,   array['image/jpeg','image/png','image/webp']),
  ('videos',     'videos',     true, 104857600, array['video/mp4']),
  ('images-360', 'images-360', true, 104857600, array['image/jpeg','image/png'])
on conflict (id) do nothing;

-- Policies de Storage
create policy "Public read images"      on storage.objects for select using (bucket_id = 'images');
create policy "Auth upload images"      on storage.objects for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');
create policy "Auth delete images"      on storage.objects for delete using (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Public read videos"      on storage.objects for select using (bucket_id = 'videos');
create policy "Auth upload videos"      on storage.objects for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');
create policy "Auth delete videos"      on storage.objects for delete using (bucket_id = 'videos' and auth.role() = 'authenticated');

create policy "Public read images-360"  on storage.objects for select using (bucket_id = 'images-360');
create policy "Auth upload images-360"  on storage.objects for insert with check (bucket_id = 'images-360' and auth.role() = 'authenticated');
create policy "Auth delete images-360"  on storage.objects for delete using (bucket_id = 'images-360' and auth.role() = 'authenticated');


-- ─── 11. TRIGGERS updated_at ─────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_page_content
  before update on public.page_content
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_integrations
  before update on public.integrations
  for each row execute procedure public.handle_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- FIM — banco Shae Sushi configurado com sucesso!
-- ═══════════════════════════════════════════════════════════════════════════
