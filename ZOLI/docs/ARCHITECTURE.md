# ZOLI — Arquitetura

## Visão

O ZOLI será mantido como um projeto versionado e organizado em dois grandes núcleos:

- **legacy**: versão histórica do ZOLI EVENTOS.
- **zoli-2.0**: reconstrução e evolução atual.

## ZOLI EVENTOS — legado

Aplicação desktop Electron, registrada na versão v1.7.

Componentes observados:

- Electron main process (`main.js`)
- preload (`preload.js`)
- renderer (`renderer/index.html`)
- metadados do aplicativo (`package.json`)

## ZOLI 2.0

Arquitetura registrada:

- Next.js no frontend
- Prisma como camada ORM
- PostgreSQL como banco de dados

O backend possui health check utilizado para validação básica de infraestrutura.

## Princípios

- GitHub como fonte de verdade.
- Nada de credenciais no repositório.
- Legado preservado sem misturar com produção atual.
- Alterações significativas devem ter commit claro.
- Testes e builds relevantes devem ser documentados.
