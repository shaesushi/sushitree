-- ── 1. Função SECURITY DEFINER ────────────────────────────────────────────────
-- Lê a role sem acionar RLS (evita recursão)
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── 2. Remover TODAS as policies existentes (independente do nome) ─────────────
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'videos' loop
    execute format('drop policy if exists %I on public.videos', pol.policyname);
  end loop;
end $$;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'page_content' loop
    execute format('drop policy if exists %I on public.page_content', pol.policyname);
  end loop;
end $$;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'integrations' loop
    execute format('drop policy if exists %I on public.integrations', pol.policyname);
  end loop;
end $$;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'click_events' loop
    execute format('drop policy if exists %I on public.click_events', pol.policyname);
  end loop;
end $$;

do $$ declare pol record; begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'page_views' loop
    execute format('drop policy if exists %I on public.page_views', pol.policyname);
  end loop;
end $$;

-- ── 3. Policies de PROFILES (sem auto-referência) ─────────────────────────────
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- ── 4. Policies de VIDEOS ────────────────────────────────────────────────────
create policy "videos_select_public"
  on public.videos for select
  using (active = true);

create policy "videos_select_admin"
  on public.videos for select
  using (public.get_my_role() = 'admin');

create policy "videos_insert_admin"
  on public.videos for insert
  with check (public.get_my_role() = 'admin');

create policy "videos_update_admin"
  on public.videos for update
  using (public.get_my_role() = 'admin');

create policy "videos_delete_admin"
  on public.videos for delete
  using (public.get_my_role() = 'admin');

-- ── 5. Policies de PAGE_CONTENT ───────────────────────────────────────────────
create policy "content_select_public"
  on public.page_content for select
  using (true);

create policy "content_all_admin"
  on public.page_content for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 6. Policies de INTEGRATIONS ───────────────────────────────────────────────
create policy "integrations_select_auth"
  on public.integrations for select
  using (auth.role() = 'authenticated');

create policy "integrations_all_admin"
  on public.integrations for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- ── 7. Policies de CLICK_EVENTS ───────────────────────────────────────────────
create policy "clicks_insert_any"
  on public.click_events for insert
  with check (true);

create policy "clicks_select_admin"
  on public.click_events for select
  using (public.get_my_role() = 'admin');

-- ── 8. Policies de PAGE_VIEWS ─────────────────────────────────────────────────
create policy "pageviews_insert_any"
  on public.page_views for insert
  with check (true);

create policy "pageviews_select_admin"
  on public.page_views for select
  using (public.get_my_role() = 'admin');
