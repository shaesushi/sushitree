"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#B8966E", "#8B6F4E", "#D4B08A", "#6B4F31", "#E8CCAA", "#4A8FA8"];
const TooltipStyle = { backgroundColor: "#181816", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 12 };

interface Props {
  daily: { date: string; count: number }[];
  categoryData: { name: string; value: number }[];
}

export function ClicksCharts({ daily, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="bg-[#181816] border-white/5 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Cliques por dia (14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TooltipStyle} />
              <Bar dataKey="count" fill="#B8966E" radius={[4, 4, 0, 0]} name="Cliques" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-[#181816] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-sm font-medium">Por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TooltipStyle} />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
