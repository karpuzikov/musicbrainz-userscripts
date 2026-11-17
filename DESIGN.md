# DESIGN.md — Karpuzikov design system

Default design system for every `karpuzikov` repository. Referenced by `UI_UX_RULES.md`. Live reference: https://claude.ai/artifact/2i6RNr257RAQenkYu1vvbm

Dark-first, flat, data-dense UI for tools and dashboards: one loud lime for actions, calm greys for everything else, numbers in a mono face.

Adapted from a public exchange-style DESIGN.md (VoltAgent/awesome-design-md). Brand color, brand fonts and product names were replaced; layout rules, spacing, type scale, radii, component patterns and principles are kept as-is.

## Principles

- **Dark first.** Default theme is Dark. Light exists for docs and print.
- **Flat.** No shadows except the focus ring. Separate areas by color blocks: `canvas` → `surface-card` → `surface-elevated`.
- **One accent job.** `primary` is reserved for primary CTAs and display headlines. Never decoration, borders or icons.
- **Dark text on primary.** Anything on `primary` uses `on-primary`.
- **Value colors are semantics.** `positive` / `negative` mean up/down, success/failure, add/remove — nothing else.
- **Display weight stays 700** (`hero-display`, `display-lg`).
- **No gradients, no glows.**
- **Numbers in mono.** Counts, sizes, durations, versions use the `numeric` family with tabular figures.

## Color

| token | dark | light | use |
| --- | --- | --- | --- |
| primary | `#C6F432` | `#C6F432` | Primary CTA fill, display headlines (dark). Light: fill only, never text |
| primary-active | `#A9D61C` | `#A9D61C` | Hover/pressed primary |
| primary-disabled | `#2F3A14` | `#E4F2B8` | Disabled primary |
| on-primary | `#181A20` | `#181A20` | Text/icons on primary |
| accent | `#2DBDB6` | `#1F8F8A` | One featured module per screen; never a CTA |
| canvas | `#0B0E11` | `#FFFFFF` | Window/page background |
| surface-card | `#1E2329` | `#FAFAFA` | Cards, panels, table cards, secondary buttons (dark), footer (light) |
| surface-elevated | `#2B3139` | `#F5F5F5` | Inputs, hover rows, raised panels |
| text | `#FFFFFF` | `#181A20` | Headings, high-emphasis text |
| body | `#EAECEF` | `#181A20` | Body text |
| muted | `#848E9C` | `#707A8A` | Secondary labels, captions, table headers |
| muted-strong | `#929AA5` | `#5E6673` | Nav links, meta text |
| hairline | `#2B3139` | `#EAECEF` | 1px dividers, row lines |
| border-strong | `#474D57` | `#CDD1D6` | Input borders, strong outlines |
| positive | `#0ECB81` | `#0ECB81` | Up / success / add |
| negative | `#F6465D` | `#F6465D` | Down / error / remove |
| info | `#3B82F6` | `#3B82F6` | Links, info, focus ring |

## Typography

Text: **Inter** (fallback `-apple-system, "Segoe UI", Roboto, sans-serif`). Numbers: **JetBrains Mono** (fallback `ui-monospace, Consolas, monospace`).

| style | size | weight | line-height | tracking | family |
| --- | --- | --- | --- | --- | --- |
| hero-display | 64px | 700 | 1.1 | -1px | sans |
| display-lg | 48px | 700 | 1.1 | -0.5px | sans |
| display-md | 40px | 600 | 1.15 | -0.3px | sans |
| display-sm | 32px | 600 | 1.2 | 0 | sans |
| title-lg | 24px | 600 | 1.3 | 0 | sans |
| title-md | 20px | 600 | 1.35 | 0 | sans |
| title-sm | 16px | 600 | 1.4 | 0 | sans |
| number-display | 40px | 700 | 1.1 | -0.3px | numeric |
| number-md | 16px | 500 | 1.4 | 0 | numeric |
| number-sm | 14px | 500 | 1.4 | 0 | numeric |
| body-md | 14px | 400 | 1.5 | 0 | sans |
| body-sm | 13px | 400 | 1.5 | 0 | sans |
| caption | 12px | 500 | 1.4 | 0 | sans |
| button | 14px | 600 | 1 | 0 | sans |
| nav-link | 14px | 500 | 1.4 | 0 | sans |

## Spacing (4px base)

`xxs` 4 · `xs` 8 · `sm` 12 · `md` 16 · `lg` 24 · `xl` 32 · `xxl` 48 · `section` 80 (px)

## Radius

`xs` 2 · `sm` 4 · `md` 6 · `lg` 8 · `xl` 12 · `pill` 9999 (px)

## Elevation

Flat. Only shadow: focus ring `0 0 0 2px rgba(59,130,246,0.5)` on every focusable control.

## Components

| component | spec |
| --- | --- |
| button-primary | `primary` fill, `on-primary` text, padding 12×24, height 40, radius md, `button` style |
| button-primary-pill | same colors, padding 14×32, radius pill |
| button-secondary (dark) | `surface-card` fill, `text` color, radius md |
| button-secondary (light) | `canvas` fill, 1px `hairline` border, `text` color |
| button-positive / button-negative | solid `positive` / `negative`, radius sm, padding 8×20 |
| button-compact | `primary`, height 28 |
| top-nav / toolbar | height 64, `nav-link` style |
| table-card | `surface-card`, radius xl, padding 24 |
| search-input (dark) | `surface-elevated`, radius lg, height 40 |
| text-input (light) | `canvas`, 1px `border-strong`, radius md, height 40 |
| badge | radius lg, height 40 |
| footer | `surface-card`, 64px vertical padding |

## Breakpoints

mobile < 768 · tablet 768–1024 · desktop 1024–1440 · wide > 1440.

## Iconography

No logo yet: plain type for names. Icons: line icons, 1.5px stroke, `currentColor`, 16/20/24px.

## CSS variables (drop-in)

```css
:root{--primary:#C6F432;--primary-active:#A9D61C;--primary-disabled:#2F3A14;--on-primary:#181A20;--accent:#2DBDB6;
--canvas:#0B0E11;--surface-card:#1E2329;--surface-elevated:#2B3139;--text:#FFFFFF;--body:#EAECEF;--muted:#848E9C;
--muted-strong:#929AA5;--hairline:#2B3139;--border-strong:#474D57;--positive:#0ECB81;--negative:#F6465D;--info:#3B82F6;
--font-sans:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;--font-numeric:"JetBrains Mono",ui-monospace,Consolas,monospace;
--radius-xs:2px;--radius-sm:4px;--radius-md:6px;--radius-lg:8px;--radius-xl:12px;--radius-pill:9999px;
--focus-ring:0 0 0 2px rgba(59,130,246,.5)}
```

## Accessibility notes

- `muted` on dark lifted from source `#707A8A` to `#848E9C` for 4.5:1 on `canvas`.
- `primary` on white fails as text — fill only in Light.
