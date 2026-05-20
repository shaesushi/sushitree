"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Save } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  value: string | null;
  enabled: boolean;
  description: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  ga4: "📊",
  gtm: "🏷️",
  pixel: "📘",
  hotjar: "🔥",
  clarity: "🔍",
  og: "🌐",
};

const TYPE_LABELS: Record<string, string> = {
  ga4: "Google Analytics 4",
  gtm: "Google Tag Manager",
  pixel: "Meta Pixel",
  hotjar: "Hotjar",
  clarity: "Microsoft Clarity",
  og: "Open Graph / SEO",
};

const PLACEHOLDERS: Record<string, string> = {
  google_analytics: "G-XXXXXXXXXX",
  google_tag_manager: "GTM-XXXXXXX",
  meta_pixel: "000000000000000",
  hotjar: "0000000",
  microsoft_clarity: "xxxxxxxxxx",
  open_graph_title: "Claudinéia Calegari · Corretora",
  open_graph_description: "Especialista em imóveis em Foz do Iguaçu",
  open_graph_image: "https://...",
};

export function IntegrationsClient({ integrations: initial }: { integrations: Integration[] }) {
  const [integrations, setIntegrations] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function update(id: string, field: "value" | "enabled", val: string | boolean) {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, [field]: val } : i));
  }

  async function saveAll() {
    setSaving(true);
    await Promise.all(
      integrations.map((i) =>
        supabase.from("integrations").update({ value: i.value, enabled: i.enabled }).eq("id", i.id)
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // Group by type
  const groups: Record<string, Integration[]> = {};
  integrations.forEach((i) => {
    if (!groups[i.type]) groups[i.type] = [];
    groups[i.type].push(i);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving} className="bg-[#B8966E] hover:bg-[#A07D5A] text-white gap-2">
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar tudo"}
        </Button>
      </div>

      {Object.entries(groups).map(([type, items]) => (
        <Card key={type} className="bg-[#181816] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <span>{TYPE_ICONS[type] ?? "🔌"}</span>
              {TYPE_LABELS[type] ?? type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {items.map((integration) => (
              <div key={integration.id} className="space-y-3 pb-5 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-white/70 text-sm">{integration.description}</Label>
                    <div className="mt-2">
                      <Input
                        value={integration.value ?? ""}
                        onChange={(e) => update(integration.id, "value", e.target.value)}
                        placeholder={PLACEHOLDERS[integration.name] ?? "ID ou valor"}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E] font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 pt-1">
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(v) => update(integration.id, "enabled", v)}
                      disabled={!integration.value}
                    />
                    <span className="text-xs text-white/30">{integration.enabled ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-[#181816] border-white/5">
        <CardContent className="p-6">
          <p className="text-white/40 text-sm leading-relaxed">
            <strong className="text-white/60">Dica:</strong> Para que GA4 e GTM funcionem corretamente, ative apenas um dos dois. O GTM já inclui suporte ao GA4 se configurado lá. Meta Pixel, Hotjar e Clarity são independentes e podem ser ativados simultaneamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
