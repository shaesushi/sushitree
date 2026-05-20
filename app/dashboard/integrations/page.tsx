import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IntegrationsClient } from "@/components/dashboard/IntegrationsClient";

async function getData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data } = await supabase.from("integrations").select("*").order("name");
  return data ?? [];
}

export default async function IntegrationsPage() {
  const integrations = await getData();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Integrações</h1>
        <p className="text-white/40 text-sm mt-1">Configure ferramentas de análise, rastreamento e SEO</p>
      </div>
      <IntegrationsClient integrations={integrations} />
    </div>
  );
}
