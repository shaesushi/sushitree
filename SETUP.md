# Setup — Claudinéia Dashboard

## 1. Criar projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Aguarde o projeto inicializar (1-2 minutos)
3. Vá em **Settings → API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar variáveis de ambiente

Abra o arquivo `.env.local` na raiz do projeto e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

## 3. Rodar o schema SQL no Supabase

1. No painel do Supabase, acesse **SQL Editor**
2. Cole e execute o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Isso criará todas as tabelas, políticas RLS e dados iniciais

## 4. Configurar autenticação no Supabase

1. No Supabase, vá em **Authentication → Settings**
2. Em **Site URL**, coloque `http://localhost:3333` (desenvolvimento) ou seu domínio
3. Em **Email Auth**, confirme que está habilitado

## 5. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## 6. Criar o primeiro usuário (admin)

1. Acesse http://localhost:3000/auth/register
2. Crie o primeiro usuário — ele será automaticamente definido como **admin**
3. Todos os usuários seguintes serão criados como **user**

## 7. Fazer o upload da foto de perfil

Coloque a foto da Claudinéia em `public/hero.jpg` para ela aparecer nos cards da landing page.

## 8. Configurar integrações

1. Faça login no dashboard
2. Vá em **Integrações**
3. Insira os IDs do Google Analytics, GTM, Meta Pixel, etc.
4. Ative cada integração com o toggle

---

## Estrutura do projeto

```
/                      → Landing page pública
/auth/login            → Login
/auth/register         → Cadastro
/dashboard             → Visão geral com métricas
/dashboard/content     → CMS: editar textos, links, vídeos
/dashboard/clicks      → Análise detalhada de cliques
/dashboard/heatmap     → Mapa de calor visual
/dashboard/users       → Gerenciar usuários (admin)
/dashboard/integrations → GA4, GTM, Meta Pixel, Hotjar, Clarity
```

## Deploy na Vercel

1. Suba o projeto para um repositório GitHub
2. Acesse https://vercel.com e importe o repositório
3. Em **Environment Variables**, adicione as variáveis do `.env.local`
4. No Supabase, adicione o domínio da Vercel em **Authentication → URL Configuration**
