# feat(web): tour de onboarding com navegação entre páginas

- **Date:** 2026-08-23
- **Type:** feat
- **Scope:** web (onboarding)

## What changed
O `OnboardingTour` passou a navegar entre rotas: cada passo pode declarar
`navigateTo`, e o overlay usa `useRouter` do App Router para ir até a página
antes de destacar o alvo. A medição do elemento virou polling (retenta até ~3s)
porque a página do Next renderiza de forma assíncrona após navegar; se o alvo
não aparecer, cai no card central. Os passos agora percorrem
`/importar → /lancamentos → /regras → /dfc → /dashboard`, com âncoras in-page
novas em Importar (`data-tour="importar-upload"`) e Regras
(`data-tour="regras-nova"`).

## Why
O tour existente só destacava a sidebar (persistente, sem navegação). Espelha o
padrão de tutorial com navegação usado em outro projeto, guiando o usuário pelas
telas reais.

## Notes
- `TourStep.navigateTo?: string` adicionado.
- Sem dependências novas (sem framer-motion) — transições via CSS, spotlight via
  `box-shadow: 0 0 0 9999px` como antes.
- `data-tour` é o contrato entre o tour e a UI; manter estável ao renomear.
