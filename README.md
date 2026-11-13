# Marques Lab — site oficial e CMS

Site institucional e painel administrativo do **Marques Lab — Laboratório de Impacto Visual**.

- **Site**: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, GSAP, Framer Motion, Three.js / React Three Fiber (hero 3D).
- **Backend**: Supabase (PostgreSQL, Auth, Storage) com RLS.
- **Painel**: `/admin` (autenticação real, três papéis: administrador, editor, gerente comercial).
- O site estático anterior está preservado em [`legacy/`](legacy).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

Sem as variáveis do Supabase o site público funciona com o conteúdo inicial embutido
(projetos de demonstração identificados como tal), `/admin` mostra um aviso de configuração
e o formulário de orçamento informa que o recebimento ainda não está ativo.

## Conectando o Supabase

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, rode em ordem: `supabase/migrations/0001_init.sql`, `0002_project_client_name.sql`, `0003_storage_limits_and_privacy.sql`, `0004_new_users_inactive.sql`, `0005_lead_idempotency.sql` e depois `supabase/seed.sql` (ou `npm run seed:remote`)
   (ou use `supabase db push` com a CLI).
3. Em **Authentication → Providers → Email**, **desative o cadastro público** (“Allow new users to sign up”).
4. Crie o primeiro usuário em **Authentication → Users → Add user** (e-mail + senha). **O primeiro usuário vira administrador**;
   os demais entram como editor e são ajustados em `/admin/usuarios`.
5. Copie URL, `anon key` e `service_role key` (Settings → API) para `.env.local`.
   A `service_role` é secreta: só no servidor (Vercel → Environment Variables, sem `NEXT_PUBLIC_`).
6. Em Authentication → URL Configuration, informe a URL do site para os convites por e-mail.

### Papéis

| Papel | Acessa |
| --- | --- |
| Administrador | tudo, incluindo configurações e usuários |
| Editor | projetos, departamentos, produtos, banners, conteúdo, categorias, mídias |
| Gerente comercial | orçamentos (CRM) e clientes |

A permissão é aplicada em três camadas: proxy (`src/proxy.ts`), checagem em cada página/ação (`requireRole`) e **RLS no banco**.

## Fluxo de orçamentos

Formulário público → `POST /api/leads` (validação Zod, limite de requisições, campo isca, anexos em bucket privado)
→ grava em `leads` com protocolo `ML-000001` e histórico automático → aparece em `/admin/orcamentos`
(status, observações, histórico, vínculo com cliente, exportação CSV).
Nenhuma mensagem automática é enviada; o visitante pode continuar pelo WhatsApp se o número estiver configurado.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `build` / `start` | desenvolvimento / build / produção |
| `npm run typecheck` · `lint` · `test` | verificações |
| `npm run db:check` | valida migrações, seed e políticas RLS em um Postgres em memória (PGlite) |
| `npm run verify:supabase` | teste de integração contra um Supabase **de homologação** (exige `HOMOLOG_CONFIRM=sim`) |
| `npm run cleanup:orphans` | lista (e com `-- --apply` apaga) arquivos órfãos do Storage |
| `npm run db:seed` | regenera `supabase/seed.sql` a partir do conteúdo em `src/lib` |

## Documentação

- [`docs/DEPLOY.md`](docs/DEPLOY.md) — configuração completa (Supabase, Vercel, variáveis, segurança, publicação, rollback)
- [`docs/HOMOLOGACAO.md`](docs/HOMOLOGACAO.md) — checklist de homologação
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — auditorias técnicas e o que ainda impede o lançamento

## Deploy (Vercel)

1. Importe o repositório e defina o **Framework Preset = Next.js** (o projeto antigo era HTML estático).
2. Configure as variáveis de `.env.example`.
3. Aponte o domínio `marqueslab.com.br`.

## O que preencher / decidir

- WhatsApp: o padrão é o número do site antigo; altere em **Configurações → WhatsApp** ou `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Uploads do painel vão direto ao Supabase Storage (imagens até 10 MB, vídeos até 50 MB); anexos do formulário público: até 4 MB no total.
- E-mail comercial, informações da empresa, logo e favicon em **Configurações**.
- ID do Google Analytics (`G-…`) em **Configurações**. O painel não consulta a API do Analytics: o dashboard apenas indica se a medição está ativa.
- Projetos reais em **Projetos** (os de demonstração aparecem só sem Supabase). Depoimentos não existem no modelo de dados: só devem ser adicionados com autorização real.
- Modelo 3D definitivo da marca: o “M” atual é gerado em código (`src/components/three/MonogramM.tsx`); para trocar por um `.glb`, coloque em `public/models/`.
- Página “Sobre”: história do Marques Lab não foi escrita (não há fatos fornecidos); missão, visão e valores são textos-base editáveis em `src/app/(site)/sobre/page.tsx`.

## Estrutura

```
src/app/(site)/     páginas públicas        src/app/admin/   painel e ações
src/app/api/leads/  API de orçamentos       src/proxy.ts     proteção de /admin
src/components/     ui, hero, three, admin  src/lib/         dados, supabase, admin, utilitários
supabase/           migrações e seed        tests/           testes (Vitest)
```
