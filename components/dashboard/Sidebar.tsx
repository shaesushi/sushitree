"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MousePointerClick,
  FileText,
  Users,
  Settings,
  Flame,
  LogOut,
  ExternalLink,
  RotateCw,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/content", label: "Conteúdo (CMS)", icon: FileText },
  { href: "/dashboard/properties-360", label: "Imóveis 360°", icon: RotateCw },
  { href: "/dashboard/clicks", label: "Cliques", icon: MousePointerClick },
  { href: "/dashboard/heatmap", label: "Mapa de Calor", icon: Flame },
  { href: "/dashboard/users", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/dashboard/integrations", label: "Integrações", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  userEmail: string;
  userRole: string;
  userName: string;
}

export function Sidebar({ userEmail, userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="w-64 min-h-screen bg-[#101010] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <p className="text-[9px] tracking-[3px] uppercase text-[#B8966E] font-medium mb-1">Painel Admin</p>
        <h2 className="font-bebas text-xl text-white tracking-wider leading-tight">CLAUDINÉIA<br/>CALEGARI</h2>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && userRole !== "admin") return null;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-[#B8966E]/15 text-[#B8966E] border border-[#B8966E]/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-2 border-t border-white/5 mt-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <ExternalLink size={16} />
            Ver landing page
          </a>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#B8966E]/20 flex items-center justify-center text-[#B8966E] text-xs font-bold">
            {(userName || userEmail)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName || userEmail}</p>
            <p className="text-white/30 text-xs capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/30 hover:text-red-400 text-xs transition-colors w-full px-1"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}
