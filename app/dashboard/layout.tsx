import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-[#0C0C0B]">
      <Sidebar
        userEmail={user.email ?? ""}
        userRole={profile?.role ?? "user"}
        userName={profile?.full_name ?? ""}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
