import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";

async function getMetrics() {
  const supabase = await createClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [viewsToday, views7, views30, clicksTotal, topButtons, dailyViews, dailyClicks] = await Promise.all([
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", last7),
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", last30),
    supabase.from("click_events").select("id", { count: "exact", head: true }).gte("created_at", last30),
    supabase.from("click_events")
      .select("button_id, button_label")
      .gte("created_at", last30)
      .limit(1000),
    supabase.from("page_views")
      .select("created_at")
      .gte("created_at", last30)
      .order("created_at"),
    supabase.from("click_events")
      .select("created_at")
      .gte("created_at", last30)
      .order("created_at"),
  ]);

  // Aggregate top buttons
  const btnMap: Record<string, { label: string; count: number }> = {};
  topButtons.data?.forEach((e) => {
    if (!btnMap[e.button_id]) btnMap[e.button_id] = { label: e.button_label ?? e.button_id, count: 0 };
    btnMap[e.button_id].count++;
  });
  const sortedButtons = Object.entries(btnMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, ...v }));

  // Build daily series (last 14 days)
  function buildDaily(rows: { created_at: string }[] | null, days = 14) {
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const count = rows?.filter((r) => r.created_at.slice(0, 10) === key).length ?? 0;
      result.push({ date: key, count });
    }
    return result;
  }

  return {
    viewsToday: viewsToday.count ?? 0,
    views7: views7.count ?? 0,
    views30: views30.count ?? 0,
    clicksTotal: clicksTotal.count ?? 0,
    topButtons: sortedButtons,
    dailyViews: buildDaily(dailyViews.data),
    dailyClicks: buildDaily(dailyClicks.data),
  };
}

export default async function DashboardPage() {
  const metrics = await getMetrics();

  const stats = [
    { label: "Visitas hoje", value: metrics.viewsToday, icon: Eye, color: "text-blue-400" },
    { label: "Visitas (7 dias)", value: metrics.views7, icon: TrendingUp, color: "text-green-400" },
    { label: "Visitas (30 dias)", value: metrics.views30, icon: Users, color: "text-purple-400" },
    { label: "Cliques (30 dias)", value: metrics.clicksTotal, icon: MousePointerClick, color: "text-[#B8966E]" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Visão Geral</h1>
        <p className="text-white/40 text-sm mt-1">Métricas dos últimos 30 dias</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-[#181816] border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <s.icon size={18} className={s.color} />
                <span className="text-white/40 text-xs">{s.label}</span>
              </div>
              <p className="text-3xl font-semibold text-white">{s.value.toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <OverviewCharts
        dailyViews={metrics.dailyViews}
        dailyClicks={metrics.dailyClicks}
        topButtons={metrics.topButtons}
      />
    </div>
  );
}
