# Checklist de homologação

Execute no **Preview da Vercel conectado ao Supabase de homologação** (veja `docs/DEPLOY.md`). Marque cada item.
Legenda da coluna **Auto**: ✅ já coberto por teste automatizado (e qual) · 🧪 coberto só em teste sem credenciais · ❌ somente manual.

Antes de começar, rode `HOMOLOG_CONFIRM=sim npm run verify:supabase` (cobre a coluna “verify”).

## A. Pré-requisitos
- [ ] Migrações `0001`, `0002`, `0003` e `seed.sql` executadas sem erro.
- [ ] Cadastro público desativado; primeiro admin criado e consegue entrar.
- [ ] Variáveis do Preview definidas (`SUPABASE_SERVICE_ROLE_KEY` **sem** `NEXT_PUBLIC_`); Redeploy feito depois de defini-las.
- [ ] `HOMOLOG_CONFIRM=sim npm run verify:supabase` → **0 falhas**.

## B. Autenticação e permissões
| Teste | Esperado | Auto |
| --- | --- | --- |
| `/admin` sem login | redireciona para `/admin/login` | ✅ curl (307) |
| `/admin/export/leads` sem login | 401 | ✅ curl |
| Senha errada | “E-mail ou senha incorretos.” | ❌ |
| 9 tentativas seguidas | “Muitas tentativas…” | 🧪 unit (rate-limit) |
| Login admin | vê todos os itens do menu | ❌ |
| Login **editor** | **não** vê Orçamentos, Clientes, Configurações, Usuários; abrir a URL direto → volta ao dashboard com “sem permissão” | ✅ verify (RLS) + ❌ UI |
| Login **comercial** | vê só Dashboard, Orçamentos, Clientes; `/admin/projetos` → negado | ✅ verify + ❌ UI |
| Usuário desativado | não consegue operar (e é redirecionado ao login) | 🧪 PGlite + ❌ UI |
| Editor tenta virar admin (SQL/PostgREST) | 0 linhas afetadas | ✅ verify, PGlite |
| Sair | volta ao login; botão “voltar” não reabre o painel | ❌ |

## C. CRUD de conteúdo (como **editor**)
Em cada módulo confira: criar, editar, excluir (com confirmação), busca, estado vazio (“Nenhum registro.”), mensagem de sucesso e de erro, botão “Salvando…”.

| Módulo | Casos | Auto |
| --- | --- | --- |
| Projetos | criar rascunho → **não** aparece no site; publicar → aparece em até 60 s; destaque aparece na Home; ordem; categoria; cliente (lista só nomes); slug duplicado → erro; SEO | ✅ verify (CRUD/visibilidade) + ❌ UI |
| Mídias de projeto | adicionar imagem e vídeo; aparece na página do projeto; excluir | ❌ |
| Departamentos | editar texto; benefícios/FAQ em JSON (JSON inválido → erro claro); desativar → some do site | ✅ verify + ❌ UI |
| Itens de serviço | adicionar/ordenar; aparece na página do departamento | ✅ verify |
| Produtos | mudar status (Em desenvolvimento/Em testes/…); despublicar → some | ✅ verify |
| Banners | editar o `hero`; refletir na Home (texto, botões, links) | ❌ |
| Conteúdo (artigos/páginas) | rascunho oculto; publicado em `/artigos/<slug>`; parágrafos por linha em branco; nenhum HTML é interpretado | ✅ verify (visibilidade) + ❌ UI |
| Categorias | criar/ordenar; filtros do portfólio refletem | ❌ |

## D. Upload e exclusão de imagens/vídeos
| Teste | Esperado | Auto |
| --- | --- | --- |
| Capa PNG/JPG/WebP ≤ 10 MB | envia; miniatura aparece; salvar grava a URL | ❌ |
| Vídeo MP4 de 20–50 MB em “Mídias” | envia direto ao Storage (sem erro 413); toca no site | ✅ verify (URL assinada) + ❌ UI |
| Vídeo > 50 MB | “Vídeo acima de 50 MB.” | ✅ unit |
| SVG / HTML / EXE | “Formato não permitido” (e o bucket também recusa) | ✅ unit + verify |
| Imagem > 10 MB | “Imagem acima de 10 MB.” | ✅ unit |
| Vídeo no campo **Capa** | recusado (só campos de mídia aceitam vídeo) | ✅ unit |
| Trocar a capa | o arquivo antigo é **removido** do bucket | ❌ (conferir em Storage) |
| “Remover arquivo” + salvar | campo limpo e arquivo removido do bucket | ❌ |
| Excluir projeto com mídias | registro e arquivos (capa + mídias) removidos do bucket | ❌ |
| Editor/anônimo/comercial tentam enviar sem permissão | negado | ✅ verify |
| Colar URL de outro domínio no campo (adulterar o form) | “Arquivo inválido” | ✅ unit |
| Logo/favicon em Configurações | refletem no cabeçalho e na aba do navegador | ❌ |

## E. Orçamentos, clientes e histórico
| Teste | Esperado | Auto |
| --- | --- | --- |
| Enviar formulário válido | mostra protocolo `ML-00000X`; aparece em Orçamentos | ✅ verify (API simulada via service role) + ❌ fluxo real |
| Campos inválidos | mensagens por campo; nada gravado | ✅ unit + navegador |
| Anexo PNG/JPG/PDF ≤ 4 MB | gravado em `lead-references`; link assinado no detalhe | ✅ verify |
| Anexo > 4 MB / .exe | recusado no formulário e no bucket | ✅ unit + verify |
| 6 envios seguidos | 429 “Muitas tentativas” | ✅ unit |
| Campo isca preenchido | “sucesso” falso, nada gravado | ✅ (testado no navegador) |
| Comercial muda status/observação | salva; histórico mostra autor e data | ✅ verify + PGlite |
| Filtros por status/serviço e busca | resultados corretos | ❌ |
| “Criar cliente a partir deste contato” | cliente criado e vinculado; link “Ver cliente” | ✅ verify + ❌ UI |
| Cliente: histórico de orçamentos | lista os protocolos | ❌ |
| **Exportar CSV** | baixa `orcamentos-AAAA-MM-DD.csv`; abre no Excel com acentos; células com `=`/`+`/`-`/`@` vêm com `'` à frente; respeita filtros | ✅ unit (formato) + ❌ download |
| Editor/anônimo | não leem orçamentos nem histórico | ✅ verify |

## F. Configurações e usuários
- [ ] Salvar WhatsApp → botão flutuante e link de contato mudam. Número vazio → volta ao padrão.
- [ ] GA inválido (`abc`) → erro; `G-XXXXXXXXXX` válido → script do GA carrega (aba Rede). Dashboard mostra “ID configurado”.
- [ ] Instagram sem `http(s)` → erro.
- [ ] Convidar usuário (precisa de SMTP): recebe e-mail, define senha, entra com o papel escolhido.
- [ ] Alterar papel/ativo; tentar rebaixar a si mesmo → bloqueado.
- [ ] Dashboard: contagens batem com os dados; “Atividades recentes” lista as ações acima.

## G. Site público
- [ ] Todas as rotas abrem: `/`, `/servicos` (+7), `/portfolio`, `/sobre`, `/tecnologia` (+6), `/contato`, `/artigos`.
- [ ] Hero 3D no desktop; em celular, “M” estático e 3D após rolar/tocar; sem WebGL e com “reduzir movimento” a página funciona.
- [ ] Menu mobile abre/fecha (botão, Esc, link); teclado e foco visível em tudo.
- [ ] Sem rolagem horizontal em 360, 768, 1280 e 1920 px.
- [ ] `/sitemap.xml` lista só conteúdo publicado; `/robots.txt` bloqueia `/admin` e `/api`; metadados e canonical por página.
- [ ] Produtos nunca aparecem como “Disponível” sem você ter marcado.

## H. Segurança
- [ ] DevTools → Rede/Fontes: **nenhuma** ocorrência da `service_role` no HTML/JS do site.
- [ ] Cabeçalhos presentes (HSTS, nosniff, X-Frame-Options, Referrer-Policy, `Content-Security-Policy-Report-Only`).
- [ ] Navegar o site e o painel com o console aberto: registrar violações de CSP; ajustar `next.config.ts`; depois promover para CSP obrigatória.
- [ ] Supabase → Authentication: signup desativado. Storage: `lead-references` privado.
- [ ] `HOMOLOG_CONFIRM=sim npm run verify:supabase` novamente após qualquer mudança de política.

## I. Qualidade (Lighthouse no Preview)
- [ ] Performance ≥ 90, Acessibilidade/Boas práticas/SEO ≥ 95 em `/`, `/servicos`, `/servicos/<slug>`, `/portfolio`, `/contato`.
- [ ] Sem erros no console.

## J. Critérios de aprovação para o merge
Todos os itens acima marcados, **0 falhas** no `verify:supabase`, Lighthouse atingindo as metas, decisões pendentes do negócio resolvidas
(retratos/ensaio com IA, depoimentos, texto do Sobre) e variáveis de **produção** configuradas.
