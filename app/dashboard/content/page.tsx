"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Save, Plus, Video, Upload, X } from "lucide-react";
import { VideoList } from "@/components/dashboard/VideoList";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";

type ContentRow = { id: string; section: string; key: string; value: string | null; type: string; label: string | null };
type VideoRow = {
  id: string;
  title: string;
  platform: string;
  mp4_url: string | null;
  external_url: string | null;
  youtube_url: string | null;
  position: number;
  active: boolean;
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero (topo da página)",
  intro: "Seção de introdução",
  links: "Links e contatos",
  cards: "Cards de links",
  footer: "Rodapé",
};

const IMAGE_HINTS: Record<string, string> = {
  "hero.image_url":       "480 × 500 px",
  "cards.img_whatsapp":   "220 × 260 px",
  "cards.img_imoveis":    "220 × 260 px",
  "cards.img_comprar":    "220 × 260 px",
  "cards.img_vender":     "220 × 260 px",
  "cards.img_instagram":  "220 × 200 px",
  "cards.img_youtube":    "220 × 200 px",
};

const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube", color: "#FF4444" },
  { value: "reels",   label: "Reels (Instagram)", color: "#E1306C" },
  { value: "tiktok",  label: "TikTok", color: "#69C9D0" },
] as const;

type NewVideo = {
  title: string;
  show_title: boolean;
  platform: "youtube" | "reels" | "tiktok";
  external_url: string;
  mp4File: File | null;
  mp4PreviewUrl: string | null;
};

const EMPTY_NEW_VIDEO: NewVideo = {
  title: "",
  show_title: true,
  platform: "youtube",
  external_url: "",
  mp4File: null,
  mp4PreviewUrl: null,
};

const MAX_PREVIEW_SEC = 20;

export default function ContentPage() {
  const [content, setContent] = useState<ContentRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newVideo, setNewVideo] = useState<NewVideo>(EMPTY_NEW_VIDEO);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    const [{ data: c }, { data: v }] = await Promise.all([
      supabase.from("page_content").select("*").order("section").order("key"),
      supabase.from("videos").select("*").order("position"),
    ]);
    if (c) setContent(c as ContentRow[]);
    if (v) setVideos(v as VideoRow[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cap preview at MAX_PREVIEW_SEC
  useEffect(() => {
    const el = videoPreviewRef.current;
    if (!el) return;
    const onTime = () => { if (el.currentTime >= MAX_PREVIEW_SEC) { el.pause(); el.currentTime = 0; el.play(); } };
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [newVideo.mp4PreviewUrl]);

  function updateValue(id: string, value: string) {
    setContent((prev) => prev.map((r) => r.id === id ? { ...r, value } : r));
  }

  async function saveAll() {
    setSaving(true);
    await Promise.all(
      content.map((r) =>
        supabase.from("page_content").update({ value: r.value }).eq("id", r.id)
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "video/mp4") { setUploadError("Apenas arquivos .mp4 são aceitos."); return; }
    if (file.size > 52428800) { setUploadError("Arquivo muito grande. Limite: 50 MB."); return; }
    const url = URL.createObjectURL(file);
    setNewVideo((p) => ({ ...p, mp4File: file, mp4PreviewUrl: url }));
  }

  function clearFile() {
    if (newVideo.mp4PreviewUrl) URL.revokeObjectURL(newVideo.mp4PreviewUrl);
    setNewVideo((p) => ({ ...p, mp4File: null, mp4PreviewUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addVideo() {
    if (!newVideo.title) { setUploadError("Informe o título do vídeo."); return; }
    if (!newVideo.mp4File && !newVideo.external_url) { setUploadError("Envie um arquivo MP4 ou informe a URL externa."); return; }
    setUploadError("");
    setUploading(true);

    let mp4_url: string | null = null;

    if (newVideo.mp4File) {
      const safeName = newVideo.title
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/gi, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const path = `${Date.now()}-${safeName}.mp4`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, newVideo.mp4File, { contentType: "video/mp4" });
      if (upErr) { setUploadError("Erro ao enviar vídeo: " + upErr.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
      mp4_url = pub.publicUrl;
    }

    const externalUrl = newVideo.external_url || "";
    const { error: insErr } = await supabase.from("videos").insert({
      title: newVideo.title,
      show_title: newVideo.show_title,
      platform: newVideo.platform,
      mp4_url,
      external_url: externalUrl || null,
      youtube_url: externalUrl || "",
      position: videos.length,
      active: true,
    });

    if (insErr) { setUploadError("Erro ao salvar vídeo: " + insErr.message); setUploading(false); return; }

    clearFile();
    setNewVideo(EMPTY_NEW_VIDEO);
    setUploading(false);
    load();
  }

  async function toggleVideo(id: string, active: boolean) {
    await supabase.from("videos").update({ active: !active }).eq("id", id);
    load();
  }

  async function deleteVideo(id: string) {
    await supabase.from("videos").delete().eq("id", id);
    load();
  }

  async function reorderVideos(reordered: typeof videos) {
    setVideos(reordered);
    await Promise.all(
      reordered.map((v) =>
        supabase.from("videos").update({ position: v.position }).eq("id", v.id)
      )
    );
  }

  const sections = Array.from(new Set(content.map((r) => r.section)));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Conteúdo (CMS)</h1>
          <p className="text-white/40 text-sm mt-1">Edite o conteúdo da sua landing page</p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="bg-[#B8966E] hover:bg-[#A07D5A] text-white gap-2">
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar tudo"}
        </Button>
      </div>

      {sections.map((section) => (
        <Card key={section} className="bg-[#181816] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-base">{SECTION_LABELS[section] ?? section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.filter((r) => r.section === section).map((row) => (
              <div key={row.id} className="space-y-1.5">
                <Label className="text-white/60 text-xs">{row.label ?? row.key}</Label>
                {row.type === "image" ? (
                  <ImageUploadField
                    rowId={row.id}
                    value={row.value ?? ""}
                    hint={IMAGE_HINTS[`${row.section}.${row.key}`] ?? "—"}
                    onChange={(url) => updateValue(row.id, url)}
                  />
                ) : row.type === "html" || (row.value && row.value.length > 80) ? (
                  <Textarea
                    value={row.value ?? ""}
                    onChange={(e) => updateValue(row.id, e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E] resize-none"
                    rows={3}
                  />
                ) : (
                  <Input
                    value={row.value ?? ""}
                    onChange={(e) => updateValue(row.id, e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Videos */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2"><Video size={16} /> Vídeos em Destaque</CardTitle>
          <CardDescription className="text-white/40">Gerencie os vídeos exibidos na landing page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Lista drag-and-drop */}
          <VideoList
            videos={videos}
            onReorder={reorderVideos}
            onToggle={toggleVideo}
            onDelete={deleteVideo}
          />

          {/* Add form */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Adicionar vídeo</p>

            {/* Title + show_title toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-xs">Título</Label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/40 text-xs">Exibir título no vídeo</span>
                  <button
                    type="button"
                    onClick={() => setNewVideo((p) => ({ ...p, show_title: !p.show_title }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newVideo.show_title ? "bg-[#B8966E]" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${newVideo.show_title ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </label>
              </div>
              <Input
                value={newVideo.title}
                onChange={(e) => setNewVideo((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Tour pelo imóvel exclusivo"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
              />
              {!newVideo.show_title && (
                <p className="text-white/30 text-xs">O título será salvo mas não aparecerá no vídeo da landing page.</p>
              )}
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Plataforma</Label>
              <div className="flex gap-2">
                {PLATFORM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewVideo((p) => ({ ...p, platform: opt.value }))}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      newVideo.platform === opt.value
                        ? "border-[#B8966E] text-white bg-[#B8966E]/10"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    <span className="block text-xs font-semibold" style={{ color: newVideo.platform === opt.value ? opt.color : undefined }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* MP4 upload */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Arquivo MP4 <span className="text-white/30">(máx. 50 MB · prévia limitada a 20s)</span></Label>
              {newVideo.mp4PreviewUrl ? (
                <div className="relative w-36 rounded-lg overflow-hidden border border-white/10">
                  <video
                    ref={videoPreviewRef}
                    src={newVideo.mp4PreviewUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full"
                    style={{ aspectRatio: "9/16", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  <p className="text-white/40 text-[10px] text-center py-1 bg-black/40">
                    {newVideo.mp4File?.name}
                  </p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#B8966E]/50 hover:bg-white/[0.02] transition-all">
                  <Upload size={20} className="text-white/20 mb-1" />
                  <span className="text-white/30 text-xs">Clique para selecionar .mp4</span>
                  <input ref={fileInputRef} type="file" accept="video/mp4" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* External URL */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">URL do vídeo <span className="text-white/30">(YouTube, Reels, TikTok — link para o vídeo completo)</span></Label>
              <Input
                value={newVideo.external_url}
                onChange={(e) => setNewVideo((p) => ({ ...p, external_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... ou https://www.instagram.com/reel/..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
              />
            </div>

            {uploadError && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{uploadError}</p>
            )}

            <Button
              onClick={addVideo}
              disabled={uploading}
              className="bg-[#B8966E] hover:bg-[#A07D5A] text-white gap-2"
            >
              {uploading ? <><Upload size={14} className="animate-pulse" /> Enviando...</> : <><Plus size={14} /> Adicionar vídeo</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
