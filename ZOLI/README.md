# ZOLI

## Central do Projeto — Marques Lab

Repositório central para o projeto ZOLI.

### Objetivo
Centralizar no GitHub código, documentação, arquitetura, histórico e decisões do ZOLI.

### Estrutura

- `docs/` — documentação e especificações
- `legacy/` — referências da versão legada
- `zoli-2.0/` — documentação e base da reconstrução
- `ops/` — notas de ambiente, build e deploy

### Histórico conhecido

#### ZOLI EVENTOS — legado
- Aplicativo desktop baseado em Electron.
- Versão registrada: v1.7.
- Estrutura observada anteriormente: `main.js`, `package.json`, `preload.js`, `renderer/index.html`.
- Dados locais registrados: `~/Library/Application Support/ZOLI EVENTOS`.
- Preferências registradas: `~/Library/Preferences/com.dgstore.zolieventos.plist`.

#### ZOLI 2.0
Reconstrução com arquitetura web moderna.

Stack registrada:
- Frontend: Next.js
- Backend: Prisma
- Banco: PostgreSQL

Também existe registro de teste inicial de infraestrutura com endpoint de health respondendo corretamente.

## Regra do repositório

O GitHub passa a ser a fonte central do ZOLI. Alterações futuras devem ser versionadas aqui antes de serem consideradas parte oficial do projeto.
