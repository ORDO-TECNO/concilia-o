# Ordo UI — how to build with this library

Ordo UI is the component set for **Ordo**, a Brazilian bank-reconciliation
platform (conciliação bancária, classificação de lançamentos, DFC). Components
are shadcn/ui-style React primitives built on Radix, styled with Tailwind
utility classes plus CSS-variable design tokens. Copy for this product is in
**Portuguese (pt-BR)**.

## Setup — no provider needed

Components read their colors and fonts from CSS variables defined in the shipped
`styles.css` (`:root`). There is **no theme/context provider to wrap** — render
any component directly. A dark palette exists under the `.dark` class; the
default `:root` is the light theme, which is what you get out of the box.

Import everything from the package root:

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@conciliacao/web';
```

Every export (including compound parts like `CardHeader`, `DialogContent`,
`SelectItem`, `TableRow`) is on the same package root.

## Styling idiom — tokens as `hsl(var(--token))`

The components are pre-styled; you mostly compose them. When you need custom
styling (layout wrappers, one-off accents), match the library by referencing the
**design tokens**, defined as HSL channels in `styles.css`:

| Token variable | Role |
|---|---|
| `--primary` / `--primary-foreground` | teal brand action (buttons, active states) |
| `--secondary` / `--secondary-foreground` | deep navy, secondary actions |
| `--accent` / `--accent-foreground` | amber highlight (hover, selected menu item) |
| `--success` / `--success-foreground` | green (status "Conciliado") |
| `--destructive` / `--destructive-foreground` | red (delete, "Duplicado") |
| `--muted` / `--muted-foreground` | subtle surfaces and secondary text |
| `--card` / `--card-foreground` | card/surface background |
| `--background` / `--foreground` | page background and body text |
| `--border` / `--input` / `--ring` | borders, field borders, focus ring |
| `--radius` | corner radius (`0.75rem`); components derive md/sm from it |

Use them as the components do — the values are HSL channels, so wrap in `hsl()`:

```tsx
<div style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }} />
```

Fonts are `var(--font-sans)` (**Plus Jakarta Sans**, body/UI) and
`var(--font-serif)` (**Playfair Display**, display). Both are defined in
`styles.css` and served from Google Fonts — no setup required.

## Where the truth lives

- **`styles.css`** — the full token set and component styles. Read it before
  writing any custom color/spacing.
- **`components/<group>/<Name>/<Name>.d.ts`** — the exact props of each component.
- **`components/<group>/<Name>/<Name>.prompt.md`** — per-component usage notes.

## One idiomatic example

```tsx
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@conciliacao/web';

function ResumoConta() {
  return (
    <Card style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Itaú · Conta Corrente</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 600 }}>R$ 148.320,75</span>
          <Badge variant="success">Conciliado</Badge>
        </div>
        <Button style={{ marginTop: 12 }}>Ver lançamentos</Button>
      </CardContent>
    </Card>
  );
}
```

Variant props carry the design language: `Button`/`Badge` take
`variant` (`default | secondary | outline | ghost | destructive | link` /
`… | success`) and `Button` takes `size` (`sm | default | lg | icon`). Prefer
those over restyling.
