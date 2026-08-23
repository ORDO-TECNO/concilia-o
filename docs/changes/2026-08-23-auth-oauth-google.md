# feat(auth): login com Google (OAuth) com vínculo de conta

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** auth (API), web, prisma/schema

## What changed

Adiciona "Continuar com Google" ao lado do login por senha. O `User` agora tem
`passwordHash` opcional, `googleId` (único) e `avatarUrl`. Novas rotas
`GET /auth/google` e `GET /auth/google/callback` usam `passport-google-oauth20`;
o callback resolve o usuário (`AuthService.validateGoogleUser`), emite o par
access+refresh reaproveitando `issueTokens`, seta o cookie httpOnly de refresh e
redireciona (302) para `WEB_APP_URL/auth/callback` — sem token na URL. A página
web `/auth/callback` chama o singleton `refreshAccessToken()` para obter o
access token do cookie e vai para `/dashboard`.

Regra de vínculo (segurança): (1) match por `googleId` → login recorrente;
(2) só se o e-mail Google for verificado, match por e-mail → vincula `googleId`;
(3) senão cria novo usuário sem senha. Nunca vincula em e-mail não verificado
(previne tomada de conta). Login por senha de usuário só-Google (`passwordHash`
nulo) cai no mesmo erro genérico "E-mail ou senha inválidos".

## Why

Habilitar login social sem abandonar o login por senha, com vínculo seguro
quando o mesmo e-mail já existe.

## Notes

- **Migration:** `20260823001905_add_google_oauth` (passwordHash opcional +
  colunas `googleId`/`avatarUrl` + índice único em `googleId`).
- **Pacotes:** `passport-google-oauth20@2.0.0`,
  `@types/passport-google-oauth20@2.0.17` (exatos).
- **Env novas** (em `.env.example`, fora da lista obrigatória de boot — a API
  sobe sem elas; só o fluxo Google exige): `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `WEB_APP_URL`.
- **Google Cloud Console** — registrar as Authorized redirect URIs:
  - `http://localhost:3001/auth/google/callback` (dev)
  - `https://<dominio-railway>/auth/google/callback` (prod)
  E as Authorized JavaScript origins do front (Vercel/localhost) conforme
  necessário.
- A `GoogleStrategy` só é registrada quando as três credenciais existem
  (factory provider em `auth.module.ts`), então devs sem credenciais Google
  continuam bootando normalmente.
- Não verificado aqui: round-trip real de OAuth com o Google (exige
  credenciais reais).
