# Persistência dos dados dos formulários — resultado (Supabase real)

**Objetivo:** nenhum usuário perde o que digitou por erro de validação, falha de conexão ou erro do servidor.
**Como foi testado:** formulário público no navegador isolado e painel no Chrome do administrador; falhas simuladas com interceptação do `fetch` (conexão, 500, 422) e **resposta perdida de verdade** (o servidor grava, a resposta some). Dados de teste “HOMOLOGAÇÃO” removidos ao final.

## Formulário público de orçamento (`/contato`)
| Teste | Resultado | Evidência |
| --- | --- | --- |
| Campo obrigatório vazio | ✅ | 4 mensagens junto dos campos (nome, WhatsApp, e-mail, descrição) e os 4 campos destacados em vermelho; serviço pré-selecionado mantido |
| E-mail inválido | ✅ | “Informe um e-mail válido” ao lado do campo; o resto do formulário mantido |
| Telefone inválido | ✅ | “Informe um WhatsApp válido com DDD…”; aceita `(91) 99999-9999`, `91999999999`, `+55 91 99999-9999`, fixo; recusa 3 e 14 dígitos |
| Correção dos campos após erro | ✅ | corrigir e-mail/telefone mantém nome, empresa, prazo, descrição e anexos; erros somem ao corrigir |
| Anexo com formato não permitido | ✅ | “\"programa.exe\": formato não permitido…” **sem perder** os anexos válidos já escolhidos; também recusa duplicado, passar de 5 arquivos ou de 4 MB, e permite remover um a um |
| Falha de conexão | ✅ | mensagem “Sem conexão… Seus dados foram mantidos”; todos os campos e o anexo continuam; botão vira “Tentar enviar novamente” |
| Erro 500 | ✅ | “O servidor teve um problema… Seus dados foram mantidos”; nada apagado |
| Servidor aponta um campo (422) | ✅ | mensagem junto do campo, campo destacado e **foco** nele |
| **Resposta perdida** (servidor gravou, navegador não soube) | ✅ | o reenvio devolve o **mesmo protocolo (ML-000010)**; no banco: **1** orçamento, **1** anexo, histórico `created` |
| Duplo/triplo clique | ✅ | 3 cliques → **1** requisição; botão desabilitado e “Enviando…” |
| Envio bem-sucedido | ✅ | protocolo exibido; só então o formulário sai da tela; “Enviar outro orçamento” zera tudo e gera nova chave |
| Revalidação no servidor | ✅ | e-mail/telefone adulterados, `.exe`, chave malformada e nome > 120 caracteres → 422 com `fields`; **0** orçamentos criados |
| Aviso ao sair com dados preenchidos | ✅ | `beforeunload` enquanto houver dados não enviados |
| Anexos e recarga da página | ℹ️ | o navegador **não** permite restaurar arquivos; o formulário avisa: “Se você recarregar ou fechar a página, será preciso anexar os arquivos de novo” |

## Painel administrativo
| Teste | Resultado | Evidência |
| --- | --- | --- |
| Erro de validação (JSON inválido em departamento) | ✅ | erro **junto do campo**, campo destacado, resumo no topo; nome, categoria, chamada, resumo, ordem e “ativo” **mantidos** |
| Corrigir e salvar | ✅ | grava e redireciona (sem falsa mensagem de falha) |
| Valor duplicado (slug) | ✅ | “Já existe um registro com este valor” no campo Slug; demais campos mantidos |
| Falha de conexão (Server Action) | ✅ | “Falha de conexão… Seus dados foram mantidos”; formulário preenchido; botão reabilitado |
| Observações do orçamento | ✅ | falha de conexão mantém status e o texto da anotação; novo clique salva |
| Configurações | ✅ | Instagram sem `https://` e GA inválido: erro no campo certo (um por vez), demais valores mantidos, **nada salvo** |
| Convite de usuário | ✅ | e-mail inválido: erro no campo; e-mail **e papel** mantidos |
| Login | ✅ | senha errada: e-mail mantido, **senha nunca devolvida**, URL sem `?erro=` |
| Selects após erro | ✅ | corrigido: o select voltava ao primeiro valor (categoria “Motion” virava “Design”) |

## Arquivos órfãos no Storage
| Cenário | Resultado |
| --- | --- |
| Trocar a imagem antes de salvar | ✅ a anterior (enviada nesta edição) é descartada |
| “Remover arquivo” antes de salvar | ✅ descartado |
| Arquivo só enviado e a página abandonada | ✅ **`npm run cleanup:orphans`** achou e removeu (simulação por padrão; `--apply` apaga; só arquivos > 24 h) |
| Orçamento: falha ao vincular anexos | ✅ os arquivos enviados são removidos; a resposta informa `attachmentsFailed` |
| Resposta perdida + reenvio | ✅ anexos não são reenviados (1 arquivo no Storage) |
| Descarte seguro | ✅ `discardUpload` só apaga na pasta do campo e se **nenhuma tabela** referencia a URL |

## Segurança e privacidade
- Nada é gravado em `localStorage`/`sessionStorage` pelos formulários; os valores ficam só na memória da página.
- **0** ocorrências de dados do orçamento nos logs do servidor (a rota de orçamentos não registra corpo, nome, e-mail ou telefone; erros devolvem apenas códigos).
- Toda validação é refeita no servidor (Zod); limites de tamanho espelham os `check` do banco, então valor aceito nunca vira erro 500.
- Idempotência: coluna `leads.idempotency_key uuid unique` (migração **0005**); duas requisições simultâneas com a mesma chave resultam em um orçamento.

## Pendências desta frente
- ⚠️ Erros de validação do **servidor** no painel mostram **um campo por vez** (o primeiro inválido); a validação do formulário público mostra todos.
- ⚠️ Arquivos enviados e abandonados dependem da varredura `cleanup:orphans` (agendar, p.ex., diariamente: Vercel Cron ou GitHub Actions).
- ⚠️ O navegador não restaura anexos após recarregar a página (limitação da plataforma; o usuário é avisado).
- ℹ️ Com a CSP em modo obrigatório, o Zod 4 tenta `new Function` para otimização e cai no caminho normal quando bloqueado (gera apenas um relatório `eval` no modo Report-Only).

---

# Homologação — resultado da execução (Supabase real)

**Ambiente:** app local (build de produção, `localhost:3100`) × projeto Supabase de homologação `ejevkmynwljegfpalsci`.
**Como foi feito:** administrador real logado no Chrome (a senha foi digitada pelo próprio dono); editor e comercial em um navegador isolado, entrando por link gerado (nenhuma senha foi digitada por mim).
**Dados de teste:** todos identificados como “HOMOLOGAÇÃO” e **removidos ao final** (inventário final: 0 projetos, 0 mídias, 0 clientes, 0 orçamentos, 0 arquivos nos buckets; seed intacto: 8 categorias, 7 departamentos, 86 itens, 6 produtos, banner e 10 configurações originais).
Legenda: ✅ aprovado · ❌ reprovado/limitação · ⏭ não executado.

## Pelo painel (interface)

| # | Teste | Resultado | Evidência |
| --- | --- | --- | --- |
| 1 | Dashboard e indicadores | ✅ | cartões batem com os dados (projetos 1/1/0, solicitações 2, em andamento 1, clientes 2); 10 atividades recentes; aviso de Analytics |
| 2 | Projeto: criar, validar, editar, publicar, excluir | ✅ | erro “Preencha Título”; rascunho 404 no site; publicado aparece em /portfolio, na Home (destaque) e na página do projeto; edição persistiu; exclusão com 404 depois |
| 3 | Upload de imagem (capa, galeria) | ✅ | upload direto; miniatura; troca de capa **removeu** a antiga do Storage |
| 4 | Upload de vídeo **49 MB** | ✅ | 13 s; Storage guardou 49 MB `video/mp4`; tocou como `<video>` no site; 51 MB e SVG recusados na hora |
| 5 | Exclusão de arquivos do Storage | ✅ | excluir mídia e excluir projeto removeram capa + galeria + vídeo (200→400 sem cache); cancelar a confirmação preservou tudo |
| 6 | Departamentos e itens de serviço | ✅ | JSON inválido → erro claro; item com pai pré-selecionado; benefícios/FAQ no site; desativar some; excluir apaga itens em cascata |
| 7 | Produtos digitais e banners | ✅ | status “Em testes” no site; banner `hero` refletiu na Home e foi restaurado; chave do banner bloqueada na edição |
| 8 | Clientes | ✅ | criar, editar (persistiu), buscar (`?q=`), excluir; ficha mostra o projeto vinculado; nome exibido no site |
| 9 | Orçamentos | ✅ | formulário público com anexo → `ML-000008`; lista, busca por nome/protocolo, filtros por status e serviço; anexo abre por URL assinada; link de WhatsApp |
| 10 | Histórico | ✅ | criação, status (com seta de/para), observação, em ordem; autor registrado no banco (verify) |
| 11 | Exportação CSV | ✅ | BOM UTF-8, cabeçalho, filtros por status/serviço; `=HOMOLOGAÇÃO` saiu como `'=HOMOLOGAÇÃO`; aspas escapadas. ⏭ clique no botão com download no navegador (testado por requisição autenticada) |
| 12 | Convite de usuário | ✅/❌ | 1º convite pela interface: perfil criado ativo como Editor. **2º convite: ❌ limite de e-mails do Supabase (429)** — mensagem agora explica a causa |
| 13 | Definir senha pelo link | ✅/⏭ | link gerado → página validou → você definiu a senha → login OK (administrador real); sem link: “Link inválido ou expirado”. ⏭ link **recebido por e-mail** (o e-mail não chegou: mesmo limite de SMTP) |
| 14 | Permissões | ✅ | ver abaixo |

### Permissões por papel
| Papel | Menu | Acesso direto negado | Escrita | CSV |
| --- | --- | --- | --- | --- |
| Administrador | tudo | — | tudo | ✅ |
| Editor | Projetos, Departamentos, Itens, Produtos, Banners, Conteúdo, Categorias, Mídias | Orçamentos, Clientes, Configurações, Usuários → `/admin?negado=1` + mensagem | editou projeto (persistiu); só vê **nomes** de clientes no select | 401 ✅ |
| Comercial | Dashboard, Orçamentos, Clientes | Projetos, Usuários, Configurações → negado; dashboard sem contagem de projetos | mudou status/observação com histórico | 200 ✅ |
| Sem login | — | `/admin` → login | — | 401 ✅ |
| Admin tentando rebaixar a si mesmo | — | “Você não pode remover seu próprio acesso” ✅ | desativar/reativar outro usuário ✅ | — |

## Qualidade transversal
| Item | Resultado |
| --- | --- |
| Estados de carregamento | ✅ botões “Salvando…”/“Enviando…”/“Entrando…” desabilitados; esqueleto “Carregando…”; campo de arquivo bloqueado durante envio |
| Mensagens de sucesso/erro | ✅ (`role=status`/`role=alert`) |
| Confirmação de exclusão | ✅ pergunta; cancelar não exclui; confirmar exclui |
| Responsividade (375 px) | ✅ dashboard, lista, detalhe e formulário sem rolagem horizontal; menu quebra em linhas |
| Console | ✅ sem erros do app. Avisos: `THREE.Clock` (biblioteca) e CSP Report-Only (do próprio teste); 1 × 401 esperado (CSV do editor) |
| Rede | ✅ sem falhas; `ERR_ABORTED` apenas em *prefetch* `_rsc` cancelados pelo Next |
| Login com senha errada | ✅ “E-mail ou senha incorretos.”, botão “Entrando…” |

## Problemas encontrados nesta execução
| Problema | Estado |
| --- | --- |
| Após salvar um projeto com categoria, a lista ficava **filtrada por essa categoria** | ✅ corrigido (só relações obrigatórias viram filtro) |
| Mídia de vídeo era gravada como `image` (select padrão) e quebraria no site | ✅ corrigido (tipo deduzido do arquivo) |
| Campo “Slug” aparecia como obrigatório mas é gerado do título | ✅ corrigido |
| Convite com limite de e-mail: mensagem genérica | ✅ mensagem específica |
| Coluna “Status” dos produtos mostrava a chave (`em_testes`) | ✅ mostra o rótulo |
| Campos de formulário com ~38 px de altura (alvo de toque) | ✅ 44 px |
| **Erro de validação limpa o formulário** (o redirecionamento perde o que foi digitado) | ⚠️ aberto (melhoria: `useActionState`) |
| Logo após publicar, a **primeira** visita pública pode ver a versão antiga (revalidação *stale-while-revalidate*) | ⚠️ aberto/aceitável; a seguinte já vê o novo |
| E-mails de convite não chegam em volume: SMTP padrão do Supabase (limite baixo) | ⚠️ **configurar SMTP próprio antes do lançamento** |
| Validação de gravação real de e-mail de convite recebido | ⏭ depende do SMTP |

---

# Checklist de homologação (modelo para repetir no Preview/produção)

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
