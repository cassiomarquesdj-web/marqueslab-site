# Guia de configuração e publicação (homologação → produção)

Este guia leva do zero a um **Preview na Vercel conectado a um Supabase de homologação**, e depois à publicação.
Nada aqui altera o site de produção atual: o Preview é gerado a partir da branch `feat/nextjs-foundation`, e só o merge na `main`
(ou promover um deploy) afeta a produção.

## 0. O que você precisa fornecer

Eu não tenho (e não devo ter) acesso às suas contas. Para fechar a homologação, você precisa criar/fornecer:

| # | O quê | Para quê | Como obter | Onde colocar |
| --- | --- | --- | --- | --- |
| 1 | **Projeto Supabase de homologação** (separado do de produção) | banco, login, storage | supabase.com → New project (região São Paulo, `sa-east-1`) | — |
| 2 | `NEXT_PUBLIC_SUPABASE_URL` | conexão | Supabase → Project Settings → API → *Project URL* | `.env.local` e Vercel (Preview) |
| 3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | conexão pública (protegida por RLS) | mesma tela → *anon public* | idem |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | **secreta**: orçamentos, anexos, convites | mesma tela → *service_role* (clique em *Reveal*) | `.env.local` e Vercel (Preview) **sem** `NEXT_PUBLIC_` |
| 5 | E-mail + senha do **primeiro administrador** | entrar no painel | você escolhe; criado em Authentication → Users | só no Supabase |
| 6 | Acesso ao projeto na **Vercel** (ou confirmação das configurações da seção 4) | Preview | Vercel → projeto → Settings | — |
| 7 | WhatsApp comercial, e-mail comercial, ID do GA (`G-…`) | contato e medição | você | painel → Configurações |
| 8 | Domínio (apenas para o go-live) | `marqueslab.com.br` | seu registrador | Vercel → Domains (só no lançamento) |

> Nunca me envie a `service_role` por chat nem a cole em arquivo versionado. Ela vai só em `.env.local` (ignorado pelo Git) e nas variáveis da Vercel.

## 1. Supabase

1. **Criar o projeto** de homologação (item 1).
2. **Rodar o SQL**, em ordem, no *SQL Editor* (ou `supabase db push` com a CLI):
   1. `supabase/migrations/0001_init.sql` — tabelas, RLS, triggers, buckets e políticas de Storage
   2. `supabase/migrations/0002_project_client_name.sql`
   3. `supabase/migrations/0003_storage_limits_and_privacy.sql` — limites/tipos dos buckets e privacidade de clientes
   4. `supabase/seed.sql` — departamentos, produtos, categorias, banner e configurações iniciais (idempotente)
3. **Authentication → Providers → Email**: desative **“Allow new users to sign up”** (só o admin cria/convida usuários).
   Mantenha “Confirm email” ligado.
4. **Authentication → URL Configuration**: *Site URL* = URL do Preview (ou do domínio final) e, em *Redirect URLs*, a URL do Preview
   (a Vercel gera `https://<projeto>-git-feat-nextjs-foundation-<time>.vercel.app`; pode usar o curinga `https://*-<time>.vercel.app/**`).
5. **Criar o primeiro administrador**: Authentication → Users → *Add user* → e-mail e senha, marcando *Auto Confirm User*.
   O primeiro usuário vira `admin` automaticamente (trigger `handle_new_user`); os seguintes entram como `editor`.
6. **E-mail de convite**: o SMTP padrão do Supabase é limitado a poucos e-mails por hora e serve só para testes.
   Para convidar usuários de verdade, configure um SMTP próprio (Authentication → SMTP Settings).
7. Confirme em **Storage** que existem os buckets `media` (público, 50 MB, imagens/vídeo) e `lead-references` (privado, 4 MB, imagem/PDF).

### Limite de arquivo (plano gratuito × pago)
O plano gratuito limita **qualquer arquivo a 50 MB**. É por isso que o bucket `media` está em 50 MB. Em plano pago, aumente
*Storage → Settings → Global file size limit*, edite `file_size_limit` na migração 0003 **e** `MAX_VIDEO_BYTES` em `src/lib/media.ts`.

## 2. Variáveis de ambiente

| Variável | Segredo? | Obrigatória | Preview | Produção | Observação |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | não | recomendada | URL do Preview (ou omitir) | `https://marqueslab.com.br` | canonical, sitemap, Open Graph |
| `NEXT_PUBLIC_SUPABASE_URL` | não | sim* | projeto de **homologação** | projeto de **produção** | *sem ela o site usa conteúdo embutido e o painel não funciona |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | não (pública) | sim* | idem | idem | segura por causa do RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **SIM** | sim* | idem | idem | só servidor; ignora RLS; nunca `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | não | não | opcional | opcional | padrão: número do site antigo; o painel tem prioridade |
| `NEXT_PUBLIC_CONTACT_EMAIL` | não | não | opcional | opcional | o painel tem prioridade |

Use **projetos Supabase diferentes** para Preview e Produção (e variáveis separadas por ambiente na Vercel), para que testes não toquem dados reais.

Local: `cp .env.example .env.local` e preencha. `.env*` (exceto `.env.example`) é ignorado pelo Git.

## 3. Rodando localmente

```bash
npm ci
cp .env.example .env.local      # preencha
npm run dev                     # http://localhost:3000
npm run typecheck && npm run lint && npm test && npm run build
npm run db:check                # valida SQL + RLS num Postgres em memória (não precisa de credenciais)
```

### Teste de integração contra o Supabase real (homologação)

```bash
# cria 3 usuários temporários, exercita permissões/CRUD/orçamentos/Storage e apaga tudo no fim
HOMOLOG_CONFIRM=sim npm run verify:supabase
```
- **Use só no projeto de homologação.** O script se recusa a rodar sem `HOMOLOG_CONFIRM=sim` e imprime o host alvo.
- Tudo que cria usa o prefixo `zz-homolog-…` e é removido no `finally`.
- Cobre 39 verificações (login/papéis, CRUD de projetos/serviços/produtos/banners/artigos, orçamentos + histórico + clientes, Storage:
  upload, URL assinada, tipos, limites, exclusão). **Não cobre** a interface (botões/telas) nem a exportação CSV (requer sessão de navegador): use `docs/HOMOLOGACAO.md`.

## 4. Vercel (Preview)

**Não mude nada na produção.** Verifique no projeto existente (Settings):

| Configuração | Valor esperado |
| --- | --- |
| Framework Preset | **Next.js** (o repositório inclui `vercel.json` com `"framework": "nextjs"`, que sobrepõe um preset antigo “Other”) |
| Root Directory | vazio / `./` (o `package.json` está na raiz) |
| Build Command | padrão (`next build`) — **sem override** |
| Output Directory | **vazio** (sem `public`/`out` herdados do site estático) |
| Install Command | padrão (`npm install`/`npm ci`) |
| Node.js Version | **22.x** (fixado em `package.json › engines` e `.nvmrc`) |
| Production Branch | continua `main`; **não faça merge** até a homologação passar |
| Environment Variables | cadastre as da seção 2 **só no escopo “Preview”** por enquanto |
| Deployment Protection | mantenha o Preview protegido (Vercel Authentication) enquanto testa |

Passos:
1. Faça push da branch (já feito) → a Vercel cria o **Preview** automaticamente.
2. Abra o Preview pelo painel da Vercel (Deployments → branch `feat/nextjs-foundation`).
3. Cadastre as variáveis (Preview) e faça **Redeploy** (variáveis só valem em novos builds).
4. Rode `docs/HOMOLOGACAO.md` no Preview.
5. Se o build falhar, abra os *Build Logs*; o erro mais provável é preset/Output Directory herdados do site estático.

Se você me der acesso de leitura (ou colar os *Build Logs* e a tela de Settings), eu confirmo cada item acima.

## 5. Segurança

| Item | Estado | Ação |
| --- | --- | --- |
| RLS em todas as tabelas | ✅ testado (PGlite, 97 verificações) | repetir no Supabase real com `verify:supabase` |
| Service role só no servidor | ✅ `import "server-only"` + sem prefixo `NEXT_PUBLIC_` | conferir que o bundle não contém a chave (HOMOLOGACAO) |
| Cadastro público desativado | ⚠️ configuração no Supabase | seção 1, passo 3 |
| Login | ✅ limite 8 tentativas/10 min por IP + limites do Supabase | — |
| Formulário de orçamento | ✅ validação Zod no servidor, isca anti-robô, 5 req/10 min por IP, tipos/tamanho de anexos | — |
| Limite de requisições | ⚠️ em memória (por instância serverless): proteção de melhor esforço | para garantia forte, usar Upstash/Vercel KV ou o Firewall da Vercel (Rate Limiting) |
| Upload | ✅ URL assinada, papel e campo validados no servidor, tipo/tamanho validados também pelo bucket; SVG proibido | — |
| URLs de imagem no painel | ✅ só aceita URLs do bucket `media` do projeto | — |
| Cabeçalhos | ✅ HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy | — |
| **CSP** | 🟡 **Report-Only** (`Content-Security-Policy-Report-Only`) | ver abaixo |
| Mensagens de erro do painel | ℹ️ o texto vem da URL (`?erro=`), renderizado como texto simples | risco baixo (não executa HTML); evoluir para mensagens por código |

### Como promover a CSP de Report-Only para obrigatória
1. Navegue o Preview inteiro (site + painel + upload) com o console aberto e acompanhe os *Runtime Logs* da Vercel (`[csp-report]`).
2. Para cada violação legítima, ajuste a diretiva correspondente em `next.config.ts`.
3. Quando não houver violações novas, troque o cabeçalho para `Content-Security-Policy`.
4. Meta posterior: substituir `'unsafe-inline'` por **nonces** (requer renderização dinâmica) para endurecer scripts.

## 6. Publicação (somente após a homologação passar)

1. Supabase de **produção**: repetir a seção 1 (migrações 0001→0003 e seed), criar o admin real, cadastro público desativado.
2. Vercel → variáveis do escopo **Production** apontando para o Supabase de produção.
3. Domínio: adicionar `marqueslab.com.br` (e `www`) em Domains; DNS conforme a Vercel indicar.
4. Revisar a seção 6 de `docs/AUDITORIA.md` (diferenças do site antigo) e decidir pontos pendentes (ex.: retratos/ensaio com IA).
5. Merge da PR na `main` → a Vercel publica em produção.
6. Pós-publicação: smoke test (`docs/HOMOLOGACAO.md`, blocos “Site público” e “Orçamento”), conferir `sitemap.xml`, enviar o sitemap ao Search Console.

### Rollback
Vercel → Deployments → deploy anterior → **Promote to Production** (instantâneo). O site antigo também está em `legacy/` e no histórico do Git.

## 7. Limitações conhecidas
- Anexos de orçamento (formulário público) seguem limitados a 4 MB no total: passam pela API (corpo máximo da Vercel ≈ 4,5 MB).
  Anexos maiores exigiriam endpoint de URL assinada para visitantes anônimos (com limitação de abuso) — não implementado.
- Vídeos do painel: até 50 MB no plano gratuito. Para vídeos longos, hospede em serviço de vídeo e use o campo “Vídeo (URL)” dos projetos (arquivo direto `.mp4`).
- Sem e-mail/WhatsApp automático ao receber orçamento (por decisão: nada é enviado sem integração autorizada).
- Exportação CSV, telas do painel e fluxo de convite por e-mail só podem ser validados com Supabase real (ver HOMOLOGACAO).
