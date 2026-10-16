# feat(app): manual e Swagger servidos pela API

- **Date:** 2026-10-16
- **Type:** feat
- **Scope:** apps/api (DocsModule, main.ts, nest-cli.json, tsconfig.build.json), apps/web (next.config), Dockerfile

## What changed
A API serve o manual em `GET /docs/ledger-manual` (lido de `docs/manual/index.html`), o Swagger UI em `/docs/api` e o OpenAPI em `/docs/api-json`, com tags por módulo, Bearer auth e schemas gerados pelo plugin do `@nestjs/swagger`. O web faz rewrite de `/docs/*` para a API. O build da API agora compila só `src/`.

## Why
Documentação navegável no próprio domínio do produto. O build antigo gerava `dist/src/main.js`, e o `CMD` do Docker (`dist/main.js`) não encontrava o entrypoint.

## Notes
Novas env vars opcionais: `DOCS_ENABLED` (padrão ligado; `false` esconde) e `API_PUBLIC_URL` (servidor do "Try it out").
