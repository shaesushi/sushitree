"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  dailyViews: { date: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  topButtons: { id: string; label: string; count: number }[];
}

const TooltipStyle = {
  backgroundColor: "#181816",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

function formatDate(str: string) {
  const [, m, d] = str.split("-");
  return `${d}/${m}`;
}

export function OverviewCharts({ dailyViews, dailyClicks, topButtons }: Props) {
  const combined = dailyViews.map((v, i) => ({
    date: formatDate(v.date),
    visitas: v.count,
    cliques: dailyClicks[i]?.count ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Line chart — visitas + cliques */}
      <Card className="bg-[#181816] border-white/5 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Visitas e Cliques (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TooltipStyle} />
              <Legend wrapperStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <Line type="monotone" dataKey="visitas" stroke="#B8966E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cliques" stroke="#6B8EAE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top buttons — bar */}
      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Top Botões (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {topButtons.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {topButtons.map((btn) => (
                <div key={btn.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60 truncate max-w-[140px]">{btn.label}</span>
                    <span className="text-[#B8966E] font-medium">{btn.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B8966E]"
                      style={{ width: `${Math.min(100, (btn.count / (topButtons[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
