"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C0C0B] p-4">
        <Card className="bg-[#181816] border-white/10 w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">✓</div>
            <h2 className="text-white font-semibold">Conta criada!</h2>
            <p className="text-white/50 text-sm">Verifique seu e-mail para confirmar o cadastro.</p>
            <Button onClick={() => router.push("/auth/login")} className="w-full bg-[#B8966E] hover:bg-[#A07D5A] text-white">
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
            <CardTitle className="text-white">Criar conta</CardTitle>
            <CardDescription className="text-white/40">Acesso liberado pelo administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/70">Nome completo</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#B8966E]" />
              </div>

              {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full bg-[#B8966E] hover:bg-[#A07D5A] text-white font-medium tracking-wider">
                {loading ? "Criando conta..." : "CRIAR CONTA"}
              </Button>

              <p className="text-center text-white/30 text-xs">
                Já tem conta?{" "}
                <a href="/auth/login" className="text-[#B8966E] hover:underline">Entrar</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
