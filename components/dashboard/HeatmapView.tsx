"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ButtonData {
  id: string;
  label: string;
  count: number;
  pct: number;
}

function heatColor(pct: number): string {
  if (pct >= 40) return "rgba(255, 80, 50, 0.85)";
  if (pct >= 25) return "rgba(255, 140, 0, 0.75)";
  if (pct >= 15) return "rgba(255, 200, 0, 0.65)";
  if (pct >= 8) return "rgba(100, 200, 100, 0.55)";
  return "rgba(50, 120, 200, 0.45)";
}

const LANDING_ELEMENTS = [
  { id: "whatsapp-geral", label: "WhatsApp — Fale Comigo" },
  { id: "whatsapp-imoveis", label: "WhatsApp — Ver Imóveis" },
  { id: "whatsapp-comprar", label: "WhatsApp — Quero Comprar" },
  { id: "whatsapp-vender", label: "WhatsApp — Quero Vender" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube-canal", label: "YouTube — Canal" },
  { id: "email", label: "E-mail" },
];

interface Props {
  buttons: ButtonData[];
}

export function HeatmapView({ buttons }: Props) {
  const dataMap: Record<string, ButtonData> = {};
  buttons.forEach((b) => { dataMap[b.id] = b; });

  const total = buttons.reduce((s, b) => s + b.count, 0);

  if (total === 0) {
    return (
      <Card className="bg-[#181816] border-white/5">
        <CardContent className="py-16 text-center">
          <p className="text-white/20">Nenhum clique registrado ainda. Comece a receber visitas na landing page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Visual heatmap */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Landing Page — Intensidade de cliques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full max-w-xs mx-auto" style={{ aspectRatio: "9/16", background: "#0C0C0B", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Simulated sections */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "8px 8px" }}>
              {/* Hero */}
              <div style={{ height: "20%", borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2 }}>HERO</span>
              </div>

              {/* Buttons */}
              {LANDING_ELEMENTS.map((el) => {
                const d = dataMap[el.id];
                const pct = d?.pct ?? 0;
                const color = pct > 0 ? heatColor(pct) : "rgba(255,255,255,0.03)";
                return (
                  <div
                    key={el.id}
                    style={{ flex: 1, borderRadius: 6, background: color, marginBottom: 3, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", transition: "background 0.5s" }}
                  >
                    <span style={{ color: pct > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)", fontSize: 8 }}>{el.label.split("—")[0].trim()}</span>
                    {pct > 0 && <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 8, fontWeight: 700 }}>{pct.toFixed(0)}%</span>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 4, justifyContent: "center" }}>
              {[
                { color: "rgba(50,120,200,0.7)", label: "Baixo" },
                { color: "rgba(100,200,100,0.7)", label: "" },
                { color: "rgba(255,200,0,0.7)", label: "" },
                { color: "rgba(255,140,0,0.7)", label: "" },
                { color: "rgba(255,80,50,0.8)", label: "Alto" },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 12, height: 6, borderRadius: 3, background: l.color }} />
                  {l.label && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>{l.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Ranking de interações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {buttons.slice(0, 10).map((btn, i) => (
            <div key={btn.id}>
              <div className="flex justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-white/20 w-4">{i + 1}.</span>
                  <span className="text-white/70">{btn.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/40">{btn.count} cliques</span>
                  <span className="font-medium" style={{ color: heatColor(btn.pct) }}>{btn.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${btn.pct}%`, background: heatColor(btn.pct) }}
                />
              </div>
            </div>
          ))}
          {buttons.length === 0 && <p className="text-white/20 text-sm text-center py-4">Sem dados ainda</p>}
        </CardContent>
      </Card>
    </div>
  );
}
