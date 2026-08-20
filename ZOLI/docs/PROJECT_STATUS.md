# ZOLI — Estado do Projeto

Data de centralização: 2026-08-20

## Repositório central

`cassiomarquesdj-web/marqueslab-site`

## Componentes conhecidos

### ZOLI EVENTOS (legado)

- Electron desktop
- Versão registrada: v1.7
- `main.js`
- `preload.js`
- `renderer/index.html`
- `package.json`
- `app.asar` observado anteriormente dentro do aplicativo empacotado

### ZOLI 2.0

- Reconstrução do sistema
- Frontend: Next.js
- Backend: Prisma
- Banco: PostgreSQL
- Health check do backend já registrado como funcional em teste anterior

## Próxima etapa de migração

1. Recuperar os arquivos físicos do ZOLI legado e do ZOLI 2.0.
2. Remover segredos, tokens, credenciais e dados locais antes do commit.
3. Organizar o código em diretórios próprios.
4. Preservar o histórico e separar claramente legado de produção atual.
5. Registrar builds, decisões e testes no GitHub.

## Importante

Este arquivo registra somente o que foi efetivamente identificado até agora. Não representa código que ainda não tenha sido recuperado do ambiente local.
