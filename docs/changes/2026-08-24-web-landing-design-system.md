# chore(web): landing alinhada ao design system

- **Date:** 2026-08-24
- **Type:** chore
- **Scope:** web (auth-marketing)

## What changed
Passe de consistência na landing (`components/auth/auth-marketing.tsx`): os dois
CTAs reais ("Entrar/Criar conta" no hero e na seção final) passaram a usar o
componente `Button` de `components/ui` em vez de `<button class="btn">` cru. As
cores fora do tema da seção final de CTA (`bg-[hsl(175 84% 13%)]` e
`text-teal-300`) foram trocadas por tokens do tema daisyui (`bg-neutral`,
`text-neutral-content`, accent `text-primary`).

## Why
Manter a landing consistente com o design system usado no resto do app
(componentes e tokens de cor), sem redesenhar o layout.

## Notes
- Layout, textos e mockups (ilustrações da UI) mantidos como estavam.
- O toggle do roadmap segue como `<button>` nativo (é um disclosure, não um CTA)
  e já usava tokens.
- Decisão visual: a seção escura final passou de teal chumbado para
  `bg-neutral` (slate) — se preferir navy da marca, trocar por `bg-secondary`.
