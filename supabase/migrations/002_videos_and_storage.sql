-- ── Atualizar tabela videos ───────────────────────────────────────────────────
alter table public.videos
  add column if not exists platform text not null default 'youtube'
    check (platform in ('youtube', 'reels', 'tiktok')),
  add column if not exists mp4_url text,
  add column if not exists external_url text;

-- Migrar youtube_url → external_url para os registros existentes
update public.videos set external_url = youtube_url where external_url is null;

-- ── Supabase Storage: buckets ─────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase:

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('videos', 'videos', true, 52428800, array['video/mp4'])
on conflict (id) do nothing;

-- Policies: leitura pública
create policy "Public read images"
  on storage.objects for select using (bucket_id = 'images');

create policy "Auth upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Auth delete images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Public read videos"
  on storage.objects for select using (bucket_id = 'videos');

create policy "Auth upload videos"
  on storage.objects for insert
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');

create policy "Auth delete videos"
  on storage.objects for delete
  using (bucket_id = 'videos' and auth.role() = 'authenticated');

-- ── Atualizar content: imagens dos cards ─────────────────────────────────────
insert into public.page_content (section, key, value, type, label) values
  ('cards', 'img_whatsapp',   '', 'image', 'Foto card WhatsApp'),
  ('cards', 'img_imoveis',    '', 'image', 'Foto card Imóveis'),
  ('cards', 'img_comprar',    '', 'image', 'Foto card Comprar'),
  ('cards', 'img_vender',     '', 'image', 'Foto card Vender'),
  ('cards', 'img_instagram',  '', 'image', 'Foto card Instagram'),
  ('cards', 'img_youtube',    '', 'image', 'Foto card YouTube')
on conflict (section, key) do nothing;
