# feat(auth): avatar do Google no usuário

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** auth (api), web (topbar)

## What changed
O `toPublicUser` do backend passou a incluir `avatarUrl`, então `/auth/me`,
login, registro e a sessão OAuth agora retornam a foto do usuário. No front, o
`AuthUser` ganhou `avatarUrl` e o topbar exibe a foto do Google quando existe,
caindo nas iniciais quando não há. Uso de `next/image` com `remotePatterns`
liberando `*.googleusercontent.com` no `next.config`.

## Why
O login com Google já salvava `avatarUrl` no banco (Fase 2), mas o dado não era
exposto nem exibido. Fecha o ciclo do perfil vindo do Google.

## Notes
- `referrerPolicy="no-referrer"` no `<Image>` — o Google pode bloquear
  requisições da foto quando há referer.
- Sem migração: a coluna `avatarUrl` já existe desde `add_google_oauth`.
