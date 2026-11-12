# Auditoria técnica — branch `feat/nextjs-foundation`

Escopo: os 4 commits da branch (`dcd6b7c`, `f633e27`, `baaa80f`, `b9771ea`) + correções desta auditoria.
Nada foi mesclado na `main` e nenhuma configuração de produção foi alterada.

## 1. Verificações executadas

| Verificação | Resultado |
| --- | --- |
| `npm ci` (instalação limpa a partir do lockfile) | OK |
| `npm run typecheck` (TypeScript 6, strict) | 0 erros |
| `npm run lint` | 0 erros, 0 avisos |
| `npm test` (Vitest) | 19/19 |
| `npm run build` (Next 16.4.6, Turbopack) | OK; rotas públicas estáticas/ISR, painel dinâmico, `Proxy` ativo |
| `npm run db:check` (migrações + seed + RLS em PGlite) | OK (11 verificações) |
| `npm audit --omit=dev` (dependências de produção) | 0 vulnerabilidades |
| `npm audit` (todas) | 7 moderadas, **somente dev** (minimatch transitivo de `typescript-eslint`/`eslint-config-next`; DoS em glob, não vai ao bundle) |
| Imports/dependências | typecheck limpo ⇒ sem imports quebrados; todas as dependências são usadas |
| Variáveis de ambiente usadas no código × `.env.example` | 6 usadas, 6 documentadas |
| Cabeçalhos de segurança (build de produção) | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS` presentes |
| `robots.txt` / `sitemap.xml` | OK (`/admin` e `/api` bloqueados; admin com `noindex`) |

### Lighthouse (build de produção local, emulação mobile padrão, lab)

| Página | Perf | A11y | Boas práticas | SEO | LCP |
| --- | --- | --- | --- | --- | --- |
| `/` (mobile) | 100 | 100 | 96→100* | 100 | 0,8 s |
| `/` (desktop) | 100 | 100 | 96→100* | 100 | 0,2 s |
| `/servicos` | 96 | 100 | 100* | 100 | 2,8 s |
| `/servicos/led-visual-experiencias` | 92 | 100 | 100* | 100 | 3,3 s |
| `/tecnologia` | 94 | 100 | 100* | 100 | 3,1 s |
| `/portfolio` | 100 | 100* | 100* | 100 | 0,8 s |
| `/contato` | 100 | 100 | 100* | 100 | 0,8 s |

\* medido após as correções (favicon, ordem de títulos). Só `/portfolio` foi remedido depois delas; as demais ganham o mesmo
ajuste de favicon e devem chegar a 100, mas **confirme no Preview**. Medições em laboratório, sem o conteúdo real do Supabase.

## 2. Problemas encontrados e correções

| # | Problema | Gravidade | Correção |
| --- | --- | --- | --- |
| 1 | O WhatsApp do site antigo (`5591991805102`) **não** existia no novo: sem a variável, o botão flutuante e o link sumiam e o site perderia o principal canal de conversão. | Alta | Número do site antigo é o padrão em `src/lib/site.ts`; o painel (Configurações) e `NEXT_PUBLIC_WHATSAPP_NUMBER` têm prioridade. **Confirme se o número ainda é válido.** |
| 2 | Uploads incompatíveis com a Vercel: orçamento aceitava 5×10 MB e o painel 25 MB, mas funções têm limite de ~4,5 MB de corpo, e Server Actions vêm com 1 MB. Falharia em produção. | Alta | Orçamento: até 5 arquivos somando 4 MB. Painel: 4 MB por arquivo; `serverActions.bodySizeLimit = 4mb`. |
| 3 | O painel permitia SVG e vídeo em campos de capa. `next/image` não otimiza SVG e quebraria a capa; SVG também pode carregar script. | Média | SVG removido; vídeo só nos campos de mídia (`url`). |
| 4 | Hero 3D bloqueava a thread principal (TBT 770–850 ms, Performance 80–81 no mobile). | Média | Em celular/aparelho modesto a cena só carrega após a primeira interação (o SVG estático é a versão simplificada); no desktop carrega com o navegador ocioso. TBT ≈ 40 ms. |
| 5 | Títulos das páginas internas só apareciam após a hidratação (LCP ruim). | Média | `PageHero` usa animação CSS pura. |
| 6 | Sem favicon (404 no console, Boas práticas 96). | Baixa | `src/app/icon.svg` com o “M”. |
| 7 | Ordem de títulos no portfólio (h1 → h3). | Baixa | Cards usam `h2`. |
| 8 | Home sem “Experiências audiovisuais” e “Diferenciais” (pedidos no briefing). | Baixa | Seções adicionadas, sem números nem clientes inventados. |

## 3. Vercel × Next.js

- Não há `vercel.json` nem `.vercel/`; não é necessário. A Vercel detecta Next.js pelo `package.json` **se o Framework Preset do projeto estiver em Next.js**.
- Não tenho acesso às configurações do projeto na Vercel. **Verifique manualmente**: (a) Framework Preset = Next.js (o projeto antigo era estático e pode estar em “Other”);
  (b) Build Command / Output Directory **sem override** (o antigo pode ter `public`/vazio); (c) Node 20.9+ (o `engines` exige); (d) variáveis de ambiente (seção 4).
- O Preview da branch não afeta a produção; só o merge na `main` (ou deploy manual) afeta.

## 4. Variáveis de ambiente

| Variável | Obrigatória | Onde | Observação |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recomendada | Preview e Produção | canonical, sitemap, OG. No Preview, use a URL do Preview ou deixe o padrão. |
| `NEXT_PUBLIC_SUPABASE_URL` | para painel e dados | todos | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | para painel e dados | todos | pública (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | para orçamentos, anexos e convites | **servidor** | secreta; nunca `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | opcional | todos | padrão = número do site antigo |
| `NEXT_PUBLIC_CONTACT_EMAIL` | opcional | todos | também editável no painel |

## 5. Funcionalidades incompletas, parciais ou não verificadas

**Não verificadas de ponta a ponta (sem credenciais do Supabase e sem Docker para um Supabase local):**
login, CRUD, upload de arquivos, CRM, exportação CSV, convite de usuário, gravação real de orçamento, política de storage. Estão cobertos por tipos, build,
testes unitários e testes de RLS no Postgres em memória, mas **precisam ser testados no Preview** (checklist abaixo).

**Parciais / limitações conhecidas:**
- Vídeos acima de 4 MB não podem ser enviados pelo painel (limite da Vercel). Solução futura: upload direto ao Supabase Storage com URL assinada.
- Limite de requisições do formulário é em memória por instância (melhor esforço); para garantia forte, usar limitador compartilhado.
- Sem CSP (Content-Security-Policy). Recomenda-se começar em modo `Report-Only` por causa do GA e dos scripts inline do Next.
- Sem notificação ao receber orçamento (e-mail/WhatsApp automático): conforme o briefing, nada é enviado sem integração autorizada.
- Visitas/conversões: o dashboard só indica se o GA está configurado; não consulta a API do Analytics.
- Depoimentos: não há tabela nem seção (só devem existir com depoimentos reais).
- Página “Sobre”: sem a história da empresa (sem fatos fornecidos); missão/visão/valores são textos-base.
- Modelo 3D definitivo: o “M” é gerado em código; trocar por `.glb` em `public/models/` quando existir.
- `npm audit fix` (dev-only) não foi aplicado para não alterar o toolchain de lint sem necessidade.

**Componentes só visuais:** nenhum botão sem ação foi encontrado. O botão flutuante de WhatsApp e links de e-mail só aparecem com dado configurado; sem Supabase, o formulário informa claramente que o envio não está ativo.

## 6. O site antigo pode ser substituído?

O antigo era **uma página única** (`index.html`, marca “ML Vision IA”, WhatsApp, Instagram, sem imagens/vídeos, fontes Sora/Plus Jakarta).
Nada foi apagado: o conteúdo está em `legacy/` e no histórico do Git. Ao publicar, o Next.js passa a servir a raiz.

Perdas/diferenças a decidir (não são bugs):
1. **Posicionamento**: o antigo vendia “ML Vision IA / impacto visual surreal / retratos e ensaio com IA / visual stage / motion flyer”. O novo segue o briefing (agência multidisciplinar) e **não tem retrato/ensaio com IA** como serviço. Decidir se entra em Design ou em Tecnologia/IA.
2. **SEO**: título e descrição mudam; âncoras antigas (`/#servicos`, `/#contato`) deixam de existir (agora `/servicos`, `/contato`).
3. **Canais**: WhatsApp e Instagram preservados.
4. Não há outras URLs antigas além de `/`, então não há redirecionamentos a configurar.
5. Rollback: a Vercel mantém o deploy anterior; basta “Promote to Production” nele.

## 7. Checklist de testes do Preview

**Configuração**
- [ ] Framework Preset = Next.js; build verde; sem override de Output Directory.
- [ ] Variáveis definidas no ambiente Preview (seção 4); `SUPABASE_SERVICE_ROLE_KEY` sem `NEXT_PUBLIC_`.
- [ ] Supabase: migrações `0001`, `0002` e `seed.sql` rodados; cadastro público **desativado**; primeiro usuário criado (vira admin).
- [ ] Authentication → URL Configuration inclui a URL do Preview.

**Site público**
- [ ] Home carrega; hero 3D aparece no desktop; em celular aparece o “M” estático e o 3D após rolar/tocar.
- [ ] Teste sem WebGL (flag do navegador) e com “reduzir movimento”: página usável.
- [ ] Todas as rotas abrem: `/servicos`, 7 páginas de departamento, `/portfolio`, `/sobre`, `/tecnologia`, 6 produtos, `/contato`, `/artigos`.
- [ ] Menu mobile abre/fecha (botão, Esc, link); teclado navega tudo; foco visível.
- [ ] Botão WhatsApp abre a conversa com o número correto; link do Instagram correto.
- [ ] Filtros do portfólio funcionam; projeto de demonstração só aparece sem Supabase.
- [ ] Produtos aparecem com status “Em desenvolvimento”, nenhum como lançado.
- [ ] `/sitemap.xml`, `/robots.txt`, favicon, título e Open Graph por página.
- [ ] Sem rolagem horizontal em 360 px, 768 px, 1280 px, 1920 px.

**Orçamento**
- [ ] Campos obrigatórios e mensagens de erro; envio válido gera `ML-00000X`.
- [ ] Registro aparece em Supabase (`leads`) e histórico `created` em `lead_history`.
- [ ] Anexo PNG/JPG/PDF (≤ 4 MB) sobe para o bucket privado; arquivo `.exe` e >4 MB são recusados.
- [ ] Envio repetido (6×) é limitado (429). Campo isca preenchido não grava.
- [ ] “Continuar pelo WhatsApp” abre com o protocolo.

**Painel**
- [ ] `/admin` sem login redireciona para `/admin/login`; senha errada mostra erro.
- [ ] Admin vê tudo; **editor** não vê orçamentos/configurações/usuários (e URL direta é negada); **comercial** não vê projetos.
- [ ] Criar/editar/publicar/excluir projeto; rascunho **não** aparece no site; publicado aparece em até 60 s.
- [ ] Upload de capa e mídia; SVG recusado; capa aparece no site.
- [ ] Destaque na Home; ordenação; categoria; slug duplicado mostra erro.
- [ ] Departamentos/itens, produtos (status), banner `hero` (reflete na Home), artigos.
- [ ] Orçamentos: filtros, mudança de status e observação geram histórico; criar cliente a partir do contato; exportar CSV abre sem fórmulas.
- [ ] Configurações: logo, favicon, WhatsApp, e-mail, GA (`G-…`) refletem no site.
- [ ] Usuários: convidar por e-mail, trocar papel, desativar; não permite remover o próprio admin.

**Qualidade**
- [ ] Lighthouse (Preview) ≥ 90 em Performance e ≥ 95 em A11y/Boas práticas/SEO nas páginas principais.
- [ ] Sem erros no console. Sem segredo no HTML/JS (`SUPABASE_SERVICE_ROLE_KEY` ausente do bundle).
