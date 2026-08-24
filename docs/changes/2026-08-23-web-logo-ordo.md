# feat(web): logo Ordo no design system e na aplicação

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** web (design system, chrome, auth, favicon)

## What changed
Adicionado o componente de marca `Logo` (`components/ui/logo.tsx`) — SVG
vetorial próprio, com `variant` (wordmark/icon) e `tone` (navy/teal/white/
current), sem dependências novas (usa `cva` + `cn`). O wordmark substituiu o
ícone genérico + texto "Ordo" na sidebar, no header da tela de login/registro
e no rodapé do marketing. Os SVGs soltos foram para `public/brand/` e o
favicon/app-icon foi ligado no metadata do root layout.

## Why
O handoff de design entregou a marca oficial; a aplicação usava um ícone
placeholder (`TrendingUp`) e texto. Passa a exibir a identidade real de forma
consistente e reaproveitável.

## Notes
- Arquivos: `public/brand/ordo-{wordmark-navy,wordmark-white,icon-navy,appicon-512}.svg`.
- Regras de uso da marca (respiro, tamanho mínimo, tons) em
  `Downloads/handoff/Logo.prompt.md`.
- O design-sync detecta o componente automaticamente em `components/ui`.
