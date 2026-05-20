"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, UserX, UserCheck } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

export function UsersClient({ users: initial, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const supabase = createClient();

  async function toggleRole(id: string, role: string) {
    const newRole = role === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("profiles").update({ active: !active }).eq("id", id);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !active } : u));
  }

  return (
    <Card className="bg-[#181816] border-white/5">
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-xs border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Usuário</th>
              <th className="text-left px-6 py-3 font-medium">Função</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Desde</th>
              <th className="text-right px-6 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B8966E]/15 flex items-center justify-center text-[#B8966E] text-xs font-bold">
                      {(u.full_name || u.email)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.full_name || "—"}</p>
                      <p className="text-white/40 text-xs">{u.email}</p>
                    </div>
                    {u.id === currentUserId && <span className="text-xs text-[#B8966E]/60">(você)</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-[#B8966E]/15 text-[#B8966E] border-[#B8966E]/20" : "bg-white/5 text-white/40 border-white/10"}>
                    {u.role === "admin" ? <Shield size={10} className="mr-1" /> : <User size={10} className="mr-1" />}
                    {u.role === "admin" ? "Admin" : "Usuário"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.active ? "default" : "destructive"} className={u.active ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"}>
                    {u.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-white/40 text-xs">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-6 py-4">
                  {u.id !== currentUserId && (
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => toggleRole(u.id, u.role)} className="text-xs text-white/40 hover:text-white gap-1.5">
                        <Shield size={12} />
                        {u.role === "admin" ? "→ Usuário" : "→ Admin"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u.id, u.active)} className={`text-xs gap-1.5 ${u.active ? "text-red-400/60 hover:text-red-400" : "text-green-400/60 hover:text-green-400"}`}>
                        {u.active ? <UserX size={12} /> : <UserCheck size={12} />}
                        {u.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-6 py-4 border-t border-white/5">
          <a href="/auth/register" target="_blank" rel="noopener" className="text-[#B8966E] hover:text-[#D4B08A] text-sm transition-colors">
            + Convidar novo usuário →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
