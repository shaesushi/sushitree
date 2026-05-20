-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on signup
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

-- ─── PAGE CONTENT (CMS) ──────────────────────────────────────────────────────
create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  key text not null,
  value text,
  type text not null default 'text' check (type in ('text', 'url', 'image', 'html')),
  label text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  unique (section, key)
);

alter table public.page_content enable row level security;

create policy "Anyone can read page content"
  on public.page_content for select using (true);

create policy "Only admins can modify page content"
  on public.page_content for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Seed initial content
insert into public.page_content (section, key, value, type, label) values
  ('hero', 'name', 'CLAUDINÉIA CALEGARI', 'text', 'Nome principal'),
  ('hero', 'eyebrow', 'CORRETORA DE IMÓVEIS', 'text', 'Eyebrow (acima do nome)'),
  ('hero', 'subtitle', 'Foz do Iguaçu · CRECI-PR 43.743', 'text', 'Subtítulo'),
  ('hero', 'image_url', '', 'image', 'Foto hero'),
  ('intro', 'headline', 'ENCONTRE O IMÓVEL DOS SEUS SONHOS', 'text', 'Título seção intro'),
  ('intro', 'subheadline', 'com quem entende o mercado', 'text', 'Subtítulo intro'),
  ('intro', 'description', 'Especialista em imóveis em Foz do Iguaçu. Atendimento personalizado e dedicado para realizar o seu sonho.', 'text', 'Descrição intro'),
  ('links', 'whatsapp_number', '5545999731581', 'text', 'Número WhatsApp'),
  ('links', 'instagram_url', 'https://www.instagram.com/claudineiacalegari/', 'url', 'URL Instagram'),
  ('links', 'youtube_url', 'https://www.youtube.com/@claudineiacalegari', 'url', 'URL YouTube'),
  ('links', 'email', 'contato@claudineiacalegari.com.br', 'text', 'E-mail contato'),
  ('footer', 'creci', 'CRECI-PR 43.743', 'text', 'Número CRECI'),
  ('footer', 'copyright', '© 2026 · Todos os direitos reservados', 'text', 'Texto copyright')
on conflict (section, key) do nothing;

-- ─── CLICK EVENTS ────────────────────────────────────────────────────────────
create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  button_id text not null,
  button_label text,
  href text,
  session_id text,
  page_url text,
  referrer text,
  user_agent text,
  country text,
  created_at timestamptz not null default now()
);

alter table public.click_events enable row level security;

create policy "Anyone can insert click events"
  on public.click_events for insert with check (true);

create policy "Only authenticated users can read click events"
  on public.click_events for select
  using (auth.uid() is not null);

-- ─── PAGE VIEWS ──────────────────────────────────────────────────────────────
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  referrer text,
  user_agent text,
  country text,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

create policy "Anyone can insert page views"
  on public.page_views for insert with check (true);

create policy "Only authenticated users can read page views"
  on public.page_views for select
  using (auth.uid() is not null);

-- ─── INTEGRATIONS ────────────────────────────────────────────────────────────
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null,
  value text,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.integrations enable row level security;

create policy "Anyone can read enabled integrations"
  on public.integrations for select using (true);

create policy "Only admins can modify integrations"
  on public.integrations for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Seed integrations
insert into public.integrations (name, type, value, enabled, description) values
  ('google_analytics', 'ga4', '', false, 'Google Analytics 4 — Measurement ID (G-XXXXXXXXXX)'),
  ('google_tag_manager', 'gtm', '', false, 'Google Tag Manager — Container ID (GTM-XXXXXXX)'),
  ('meta_pixel', 'pixel', '', false, 'Meta Pixel (Facebook) — Pixel ID'),
  ('hotjar', 'hotjar', '', false, 'Hotjar — Site ID (heatmap e gravação)'),
  ('microsoft_clarity', 'clarity', '', false, 'Microsoft Clarity — Project ID'),
  ('open_graph_title', 'og', 'Claudinéia Calegari · Corretora de Imóveis', false, 'Open Graph — Título de compartilhamento'),
  ('open_graph_description', 'og', 'Especialista em imóveis em Foz do Iguaçu. CRECI-PR 43.743.', false, 'Open Graph — Descrição'),
  ('open_graph_image', 'og', '', false, 'Open Graph — URL da imagem de compartilhamento')
on conflict (name) do nothing;

-- ─── VIDEOS ──────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  thumbnail_url text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "Anyone can read active videos"
  on public.videos for select using (active = true);

create policy "Only admins can modify videos"
  on public.videos for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

insert into public.videos (title, youtube_url, position) values
  ('Imóveis disponíveis', 'https://www.youtube.com/watch?v=SKP4VM3KAJQ', 0)
on conflict do nothing;

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
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
