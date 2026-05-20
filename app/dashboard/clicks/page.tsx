import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClicksCharts } from "@/components/dashboard/ClicksCharts";
import { MousePointerClick } from "lucide-react";

async function getClickData() {
  const supabase = await createClient();
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [allClicks, recent] = await Promise.all([
    supabase.from("click_events").select("button_id, button_label, created_at, href").gte("created_at", last30).order("created_at", { ascending: false }).limit(5000),
    supabase.from("click_events").select("button_id, button_label, href, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  // Aggregate by button
  const btnMap: Record<string, { label: string; count: number; href: string }> = {};
  allClicks.data?.forEach((e) => {
    if (!btnMap[e.button_id]) btnMap[e.button_id] = { label: e.button_label ?? e.button_id, count: 0, href: e.href ?? "" };
    btnMap[e.button_id].count++;
  });

  const byButton = Object.entries(btnMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, v]) => ({ id, ...v }));

  // Daily aggregation (last 14 days)
  const now = new Date();
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dailyMap[d] = 0;
  }
  allClicks.data?.forEach((e) => {
    const d = e.created_at.slice(0, 10);
    if (d in dailyMap) dailyMap[d]++;
  });
  const daily = Object.entries(dailyMap).map(([date, count]) => {
    const [, m, d] = date.split("-");
    return { date: `${d}/${m}`, count };
  });

  // Category breakdown
  const categories: Record<string, number> = {};
  allClicks.data?.forEach((e) => {
    const cat = e.button_id.split("-")[0];
    categories[cat] = (categories[cat] ?? 0) + 1;
  });
  const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

  return {
    total: allClicks.data?.length ?? 0,
    byButton,
    daily,
    categoryData,
    recent: recent.data ?? [],
  };
}

export default async function ClicksPage() {
  const data = await getClickData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Análise de Cliques</h1>
        <p className="text-white/40 text-sm mt-1">Últimos 30 dias · {data.total.toLocaleString("pt-BR")} cliques registrados</p>
      </div>

      <ClicksCharts daily={data.daily} categoryData={data.categoryData} />

      {/* Tabela por botão */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
            <MousePointerClick size={16} className="text-[#B8966E]" />
            Cliques por botão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left py-2 pr-4 font-medium">Botão</th>
                  <th className="text-left py-2 pr-4 font-medium">ID</th>
                  <th className="text-right py-2 font-medium">Cliques</th>
                  <th className="text-right py-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data.byButton.map((btn) => (
                  <tr key={btn.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{btn.label}</td>
                    <td className="py-3 pr-4 text-white/30 text-xs font-mono">{btn.id}</td>
                    <td className="py-3 text-right text-[#B8966E] font-semibold">{btn.count}</td>
                    <td className="py-3 text-right text-white/40">
                      {data.total > 0 ? `${((btn.count / data.total) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.byButton.length === 0 && (
              <p className="text-white/20 text-sm text-center py-8">Sem cliques registrados ainda</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recentes */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Últimos cliques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent.map((e: { button_label: string; button_id: string; created_at: string }, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <p className="text-white text-sm">{e.button_label}</p>
                  <p className="text-white/30 text-xs font-mono">{e.button_id}</p>
                </div>
                <p className="text-white/30 text-xs">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
            {data.recent.length === 0 && <p className="text-white/20 text-sm text-center py-4">Sem dados</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
