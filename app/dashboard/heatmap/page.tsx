import { createClient } from "@/lib/supabase/server";
import { HeatmapView } from "@/components/dashboard/HeatmapView";

async function getClickData() {
  const supabase = await createClient();
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("click_events")
    .select("button_id, button_label")
    .gte("created_at", last30);

  const btnMap: Record<string, { label: string; count: number }> = {};
  data?.forEach((e) => {
    if (!btnMap[e.button_id]) btnMap[e.button_id] = { label: e.button_label ?? e.button_id, count: 0 };
    btnMap[e.button_id].count++;
  });

  const total = Object.values(btnMap).reduce((s, v) => s + v.count, 0);

  return Object.entries(btnMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, v]) => ({ id, label: v.label, count: v.count, pct: total > 0 ? (v.count / total) * 100 : 0 }));
}

export default async function HeatmapPage() {
  const buttons = await getClickData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mapa de Calor</h1>
        <p className="text-white/40 text-sm mt-1">Visualize quais elementos da landing page recebem mais atenção</p>
      </div>
      <HeatmapView buttons={buttons} />
    </div>
  );
}
