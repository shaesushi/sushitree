-- ── Corrige infinite recursion no RLS de profiles ────────────────────────────
-- Cria função SECURITY DEFINER que lê a role do usuário sem acionar RLS

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Recriar políticas de videos usando a função segura ────────────────────────

drop policy if exists "Admins manage videos"  on public.videos;
drop policy if exists "Admin insert videos"   on public.videos;
drop policy if exists "Admin update videos"   on public.videos;
drop policy if exists "Admin delete videos"   on public.videos;
drop policy if exists "Users read active videos" on public.videos;
drop policy if exists "Public read videos"    on public.videos;
drop policy if exists "Auth users manage videos" on public.videos;

-- Leitura pública (vídeos ativos) — sem restrição de auth
create policy "Public read active videos"
  on public.videos for select
  using (active = true);

-- Admin lê todos (incluindo inativos)
create policy "Admin read all videos"
  on public.videos for select
  using (public.get_my_role() = 'admin');

-- Apenas admin pode inserir / atualizar / deletar
create policy "Admin insert videos"
  on public.videos for insert
  with check (public.get_my_role() = 'admin');

create policy "Admin update videos"
  on public.videos for update
  using (public.get_my_role() = 'admin');

create policy "Admin delete videos"
  on public.videos for delete
  using (public.get_my_role() = 'admin');

-- ── Recriar políticas de outras tabelas que também consultam profiles ─────────

-- page_content
drop policy if exists "Admins manage content" on public.page_content;
drop policy if exists "Admin manage content"  on public.page_content;
drop policy if exists "Public read content"   on public.page_content;

create policy "Public read content"
  on public.page_content for select
  using (true);

create policy "Admin manage content"
  on public.page_content for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- integrations
drop policy if exists "Admins manage integrations" on public.integrations;
drop policy if exists "Admin manage integrations"  on public.integrations;
drop policy if exists "Auth read integrations"     on public.integrations;

create policy "Auth read integrations"
  on public.integrations for select
  using (auth.role() = 'authenticated');

create policy "Admin manage integrations"
  on public.integrations for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- click_events / page_views — qualquer um pode inserir, admin lê
drop policy if exists "Anyone insert clicks"    on public.click_events;
drop policy if exists "Admin read clicks"       on public.click_events;
drop policy if exists "Anyone insert pageviews" on public.page_views;
drop policy if exists "Admin read pageviews"    on public.page_views;

create policy "Anyone insert clicks"
  on public.click_events for insert
  with check (true);

create policy "Admin read clicks"
  on public.click_events for select
  using (public.get_my_role() = 'admin');

create policy "Anyone insert pageviews"
  on public.page_views for insert
  with check (true);

create policy "Admin read pageviews"
  on public.page_views for select
  using (public.get_my_role() = 'admin');
