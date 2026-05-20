"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, X, RotateCw, ImageIcon, ArrowLeft, Trash2 } from "lucide-react";
import { Property360List } from "@/components/dashboard/Property360List";
import imageCompression from "browser-image-compression";

type Property360Row = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  external_url: string | null;
  position: number;
  active: boolean;
  imageCount?: number;
};

type Image360Row = {
  id: string;
  property_id: string;
  image_url: string;
  label: string;
  position: number;
};

type NewProperty = {
  title: string;
  show_title: boolean;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  external_url: string;
};

const EMPTY_PROP: NewProperty = {
  title: "",
  show_title: true,
  thumbnailFile: null,
  thumbnailPreview: null,
  external_url: "",
};

export default function Properties360Page() {
  const [properties, setProperties] = useState<Property360Row[]>([]);
  const [newProp, setNewProp] = useState<NewProperty>(EMPTY_PROP);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const thumbRef = useRef<HTMLInputElement>(null);

  // Gerenciamento de fotos por imóvel
  const [managingId, setManagingId] = useState<string | null>(null);
  const [images, setImages] = useState<Image360Row[]>([]);
  const [newImageLabel, setNewImageLabel] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageName, setNewImageName] = useState<string | null>(null);
  const [newImageOriginalSize, setNewImageOriginalSize] = useState<number>(0);
  const [newImageCompressedSize, setNewImageCompressedSize] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const img360Ref = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // ── Carrega imóveis ────────────────────────────────────────────────────────
  const loadProperties = useCallback(async () => {
    const { data: props } = await supabase
      .from("properties_360")
      .select("id, title, thumbnail_url, external_url, position, active")
      .order("position");

    if (!props) return;

    // Conta fotos de cada imóvel
    const { data: counts } = await supabase
      .from("property_360_images")
      .select("property_id");

    const countMap: Record<string, number> = {};
    counts?.forEach((r) => {
      countMap[r.property_id] = (countMap[r.property_id] ?? 0) + 1;
    });

    setProperties(
      props.map((p) => ({ ...p, imageCount: countMap[p.id] ?? 0 }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  // ── Carrega fotos do imóvel selecionado ────────────────────────────────────
  const loadImages = useCallback(async (propertyId: string) => {
    const { data } = await supabase
      .from("property_360_images")
      .select("*")
      .eq("property_id", propertyId)
      .order("position");
    if (data) setImages(data as Image360Row[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (managingId) loadImages(managingId);
    else setImages([]);
  }, [managingId, loadImages]);

  // ── Thumbnail do imóvel ────────────────────────────────────────────────────
  function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setError("Thumbnail: use JPEG, PNG ou WebP."); return; }
    if (file.size > 5242880) { setError("Thumbnail muito grande. Limite: 5 MB."); return; }
    const url = URL.createObjectURL(file);
    setNewProp((p) => ({ ...p, thumbnailFile: file, thumbnailPreview: url }));
  }

  function clearThumb() {
    if (newProp.thumbnailPreview) URL.revokeObjectURL(newProp.thumbnailPreview);
    setNewProp((p) => ({ ...p, thumbnailFile: null, thumbnailPreview: null }));
    if (thumbRef.current) thumbRef.current.value = "";
  }

  // ── Adicionar imóvel ───────────────────────────────────────────────────────
  async function addProperty() {
    if (!newProp.title) { setError("Informe o título do imóvel."); return; }
    setError("");
    setUploading(true);

    let thumbnail_url: string | null = null;

    if (newProp.thumbnailFile) {
      const ext = newProp.thumbnailFile.type === "image/jpeg" ? "jpg" : newProp.thumbnailFile.type.split("/")[1];
      const path = `thumb360-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, newProp.thumbnailFile, { contentType: newProp.thumbnailFile.type });
      if (upErr) { setError("Erro ao enviar thumbnail: " + upErr.message); setUploading(false); return; }
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      thumbnail_url = data.publicUrl;
    }

    const { data: inserted, error: insErr } = await supabase
      .from("properties_360")
      .insert({
        title: newProp.title,
        show_title: newProp.show_title,
        thumbnail_url,
        external_url: newProp.external_url || null,
        position: properties.length,
        active: true,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      setError("Erro ao salvar: " + insErr?.message);
      setUploading(false);
      return;
    }

    clearThumb();
    setNewProp(EMPTY_PROP);
    setUploading(false);
    await loadProperties();

    // Abre automaticamente o gerenciador de fotos para o imóvel recém criado
    setManagingId(inserted.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Gerenciamento de fotos 360° ────────────────────────────────────────────
  async function handleImage360(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { setImageError("Use JPEG ou PNG."); return; }
    if (file.size > 104857600) { setImageError("Arquivo muito grande. Limite: 100 MB."); return; }

    const originalMB = file.size / 1048576;
    setNewImageOriginalSize(originalMB);
    setCompressing(true);
    setNewImageName(file.name);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 4,
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
        onProgress: () => {},
      });

      const compressedMB = compressed.size / 1048576;
      setNewImageCompressedSize(compressedMB);

      // Garante que o nome do arquivo comprimido seja .jpg
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
      setNewImageFile(compressedFile);
    } catch {
      // Se falhar a compressão, usa o original
      setNewImageFile(file);
      setNewImageCompressedSize(originalMB);
    } finally {
      setCompressing(false);
    }
  }

  async function addImage() {
    if (!managingId) return;
    if (!newImageFile) { setImageError("Selecione a imagem 360°."); return; }
    setImageError("");
    setUploadingImage(true);

    const safeName = (newImageLabel || "foto")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const path = `${managingId}/${Date.now()}-${safeName}.jpg`;

    const { error: upErr } = await supabase.storage
      .from("images-360")
      .upload(path, newImageFile, { contentType: "image/jpeg" });
    if (upErr) { setImageError("Erro ao enviar: " + upErr.message); setUploadingImage(false); return; }

    const { data } = supabase.storage.from("images-360").getPublicUrl(path);

    const { error: insErr } = await supabase.from("property_360_images").insert({
      property_id: managingId,
      image_url: data.publicUrl,
      label: newImageLabel || `Foto ${images.length + 1}`,
      position: images.length,
    });

    if (insErr) { setImageError("Erro ao salvar: " + insErr.message); setUploadingImage(false); return; }

    setNewImageLabel("");
    setNewImageFile(null);
    setNewImageName(null);
    if (img360Ref.current) img360Ref.current.value = "";
    setUploadingImage(false);
    await loadImages(managingId);
    await loadProperties();
  }

  async function deleteImage(imageId: string) {
    await supabase.from("property_360_images").delete().eq("id", imageId);
    if (managingId) {
      await loadImages(managingId);
      await loadProperties();
    }
  }

  // ── Ações da lista ─────────────────────────────────────────────────────────
  async function toggleProperty(id: string, active: boolean) {
    await supabase.from("properties_360").update({ active: !active }).eq("id", id);
    loadProperties();
  }

  async function deleteProperty(id: string) {
    await supabase.from("properties_360").delete().eq("id", id);
    if (managingId === id) setManagingId(null);
    loadProperties();
  }

  async function reorderProperties(reordered: typeof properties) {
    setProperties(reordered);
    await Promise.all(
      reordered.map((p) =>
        supabase.from("properties_360").update({ position: p.position }).eq("id", p.id)
      )
    );
  }

  const managingProperty = properties.find((p) => p.id === managingId);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Imóveis em 360°</h1>
        <p className="text-white/40 text-sm mt-1">
          Gerencie os imóveis com visualização panorâmica 360°
        </p>
      </div>

      {/* ── Painel de gerenciamento de fotos ── */}
      {managingId && managingProperty && (
        <Card className="bg-[#181816] border-[#B8966E]/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setManagingId(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <RotateCw size={15} className="text-[#B8966E]" />
                  Fotos 360° — {managingProperty.title}
                </CardTitle>
                <CardDescription className="text-white/40 mt-0.5">
                  {images.length === 0
                    ? "Nenhuma foto cadastrada ainda"
                    : `${images.length} foto${images.length > 1 ? "s" : ""} cadastrada${images.length > 1 ? "s" : ""}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Lista de fotos existentes */}
            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/8 bg-white/[0.02]"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#B8966E]/15 flex items-center justify-center">
                      <span className="text-[#B8966E] text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{img.label}</p>
                      <p className="text-white/30 text-[10px] truncate">{img.image_url}</p>
                    </div>
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="text-red-400/40 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para adicionar nova foto */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                Adicionar foto 360°
              </p>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">
                  Nome do ambiente <span className="text-white/30">(ex: Sala de Estar, Quarto, Cozinha)</span>
                </Label>
                <Input
                  value={newImageLabel}
                  onChange={(e) => setNewImageLabel(e.target.value)}
                  placeholder="Sala de Estar"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">
                  Imagem 360° <span className="text-white/30">(equiretangular · JPEG ou PNG · máx. 50 MB)</span>
                </Label>
                {newImageName ? (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    {compressing ? (
                      <RotateCw size={14} className="text-[#B8966E] flex-shrink-0 animate-spin" />
                    ) : (
                      <RotateCw size={14} className="text-[#B8966E] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white/60 text-xs truncate block">{newImageName}</span>
                      {compressing && (
                        <span className="text-[#B8966E]/70 text-[10px]">Comprimindo imagem...</span>
                      )}
                      {!compressing && newImageCompressedSize > 0 && (
                        <span className="text-emerald-400/70 text-[10px]">
                          {newImageOriginalSize.toFixed(1)} MB → {newImageCompressedSize.toFixed(1)} MB
                          {" "}(−{Math.round((1 - newImageCompressedSize / newImageOriginalSize) * 100)}%)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewImageFile(null);
                        setNewImageName(null);
                        setNewImageOriginalSize(0);
                        setNewImageCompressedSize(0);
                        if (img360Ref.current) img360Ref.current.value = "";
                      }}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#B8966E]/50 hover:bg-white/[0.02] transition-all">
                    <RotateCw size={16} className="text-white/20 mb-1" />
                    <span className="text-white/30 text-xs">Clique para selecionar arquivo equiretangular</span>
                    <span className="text-white/15 text-[10px] mt-0.5">JPEG · PNG</span>
                    <input
                      ref={img360Ref}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleImage360}
                    />
                  </label>
                )}
              </div>

              {imageError && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{imageError}</p>
              )}

              <Button
                onClick={addImage}
                disabled={uploadingImage || compressing}
                className="bg-[#B8966E] hover:bg-[#A07D5A] text-white gap-2"
              >
                {compressing ? (
                  <><RotateCw size={14} className="animate-spin" /> Comprimindo...</>
                ) : uploadingImage ? (
                  <><Upload size={14} className="animate-pulse" /> Enviando...</>
                ) : (
                  <><Plus size={14} /> Adicionar foto</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lista de imóveis ── */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <RotateCw size={16} /> Galeria 360°
          </CardTitle>
          <CardDescription className="text-white/40">
            Clique em &quot;Fotos&quot; para gerenciar os ambientes de cada imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <Property360List
            properties={properties}
            onReorder={reorderProperties}
            onToggle={toggleProperty}
            onDelete={deleteProperty}
            onManageImages={(id) => {
              setManagingId(id === managingId ? null : id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          {/* Formulário de novo imóvel */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
              Adicionar imóvel
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-xs">Título do imóvel</Label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/40 text-xs">Exibir título no card</span>
                  <button
                    type="button"
                    onClick={() => setNewProp((p) => ({ ...p, show_title: !p.show_title }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newProp.show_title ? "bg-[#B8966E]" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${newProp.show_title ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </label>
              </div>
              <Input
                value={newProp.title}
                onChange={(e) => setNewProp((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Casa Country Iguaçu"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
              />
              {!newProp.show_title && (
                <p className="text-white/30 text-xs">O título será salvo mas não aparecerá no card da landing page.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">
                Thumbnail{" "}
                <span className="text-white/30">
                  (imagem de capa · 220 × 320 px · JPEG, PNG ou WebP · máx. 5 MB)
                </span>
              </Label>
              {newProp.thumbnailPreview ? (
                <div className="relative w-20 rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={newProp.thumbnailPreview}
                    alt=""
                    className="w-full"
                    style={{ aspectRatio: "9/16", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={clearThumb}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500/80 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#B8966E]/50 hover:bg-white/[0.02] transition-all">
                  <ImageIcon size={18} className="text-white/20 mb-1" />
                  <span className="text-white/30 text-xs">JPEG · PNG · WebP</span>
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleThumb}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">
                URL do vídeo <span className="text-white/30">(YouTube, Reels, TikTok — opcional)</span>
              </Label>
              <Input
                value={newProp.external_url}
                onChange={(e) => setNewProp((p) => ({ ...p, external_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button
              onClick={addProperty}
              disabled={uploading}
              className="bg-[#B8966E] hover:bg-[#A07D5A] text-white gap-2"
            >
              {uploading ? (
                <><Upload size={14} className="animate-pulse" /> Salvando...</>
              ) : (
                <><Plus size={14} /> Adicionar imóvel</>
              )}
            </Button>
            <p className="text-white/20 text-[10px]">
              Após salvar, o painel de fotos 360° abre automaticamente para você subir os ambientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
