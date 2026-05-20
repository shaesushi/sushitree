import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/dashboard/UsersClient";

async function getUsers() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active, created_at")
    .order("created_at", { ascending: false });

  return { users: users ?? [], currentUserId: user.id };
}

export default async function UsersPage() {
  const { users, currentUserId } = await getUsers();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Usuários</h1>
        <p className="text-white/40 text-sm mt-1">{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>
      </div>
      <UsersClient users={users} currentUserId={currentUserId} />
    </div>
  );
}
