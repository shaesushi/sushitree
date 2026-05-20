"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, CheckCircle } from "lucide-react";

interface Props {
  rowId: string;
  value: string;
  hint: string;
  onChange: (url: string) => void;
}

export function ImageUploadField({ rowId, value, hint, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFile(file: File) {
    setError("");
    setSaved(false);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5242880) {
      setError("Arquivo muito grande. Limite: 5 MB.");
      return;
    }

    setUploading(true);
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("images")
      .upload(path, file, { contentType: file.type });

    if (upErr) {
      setError("Erro ao enviar: " + upErr.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    const url = data.publicUrl;

    // Salva imediatamente no banco
    const { error: dbErr } = await supabase
      .from("page_content")
      .update({ value: url })
      .eq("id", rowId);

    if (dbErr) {
      setError("Imagem enviada mas erro ao salvar: " + dbErr.message);
    } else {
      onChange(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setUploading(false);
  }

  return (
    <div className="space-y-2">
      {/* Hint */}
      <p className="text-white/30 text-[10px] tracking-wide">
        Tamanho recomendado: <span className="text-[#B8966E]">{hint}</span>
        &nbsp;·&nbsp;Formatos aceitos: <span className="text-white/50">JPEG, PNG, WebP</span>
        &nbsp;·&nbsp;Máx. 5 MB
      </p>

      <div className="flex gap-3 items-stretch">
        {/* Preview */}
        {value ? (
          <div className="relative flex-shrink-0 group">
            <img
              src={value}
              alt=""
              className="h-20 w-auto rounded-lg border border-white/10 object-cover max-w-[80px]"
            />
            <button
              type="button"
              onClick={async () => {
                onChange("");
                await supabase.from("page_content").update({ value: "" }).eq("id", rowId);
              }}
              className="absolute -top-1.5 -right-1.5 bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="h-20 w-[80px] rounded-lg border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-white/10 text-[9px] text-center leading-tight px-1">sem<br/>imagem</span>
          </div>
        )}

        {/* Upload zone */}
        <label
          className={`flex flex-col items-center justify-center flex-1 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            uploading
              ? "border-white/20 opacity-60 pointer-events-none"
              : "border-white/10 hover:border-[#B8966E]/50 hover:bg-white/[0.02]"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle size={16} className="text-green-400 mb-1" />
              <span className="text-green-400 text-[10px]">Salvo com sucesso!</span>
            </>
          ) : uploading ? (
            <>
              <Upload size={16} className="text-white/20 mb-1 animate-pulse" />
              <span className="text-white/30 text-[10px]">Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={16} className="text-white/20 mb-1" />
              <span className="text-white/30 text-[10px]">{value ? "Trocar imagem" : "Clique para enviar"}</span>
              <span className="text-white/15 text-[9px] mt-0.5">JPEG · PNG · WebP</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 rounded px-2 py-1">{error}</p>
      )}
    </div>
  );
}
