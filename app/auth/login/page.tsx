"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0C0B] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[10px] font-medium tracking-[4px] uppercase text-[#B8966E] mb-2">PAINEL ADMINISTRATIVO</p>
          <h1 className="font-bebas text-4xl text-white tracking-wider">CLAUDINÉIA CALEGARI</h1>
        </div>

        <Card className="bg-[#181816] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Entrar</CardTitle>
            <CardDescription className="text-white/40">Acesse o painel de gerenciamento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B8966E] hover:bg-[#A07D5A] text-white font-medium tracking-wider"
              >
                {loading ? "Entrando..." : "ENTRAR"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2026 · Shae Sushi · Foz do Iguaçu
        </p>
      </div>
    </div>
  );
}
