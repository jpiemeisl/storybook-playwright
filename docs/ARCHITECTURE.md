# Architecture

How the pattern library is put together, what may depend on what, and how content and checkout flow
through it.

## Layers

```mermaid
flowchart TB
  subgraph core["Core library (src/)"]
    tokens["Design tokens<br/>primitives → semantic → themes"]
    components["Components<br/>src/components"]
    templates["Templates and SiteLayout<br/>src/templates"]
    model["Content model<br/>src/content-types"]
    registry["Block registry and renderer<br/>src/registry"]
    adapters["CMS adapters<br/>src/adapters"]
  end
  subgraph commerce["Commerce (src/commerce)"]
    ctypes["Types and pure logic<br/>cart, checkout, account"]
    ccomponents["Commerce components"]
    ctemplates["Commerce templates"]
  end
  demo["Demo only (demo/)<br/>providers, demo shop"]

  tokens --> components --> templates
  model --> registry --> templates
  adapters --> model
  components --> ccomponents
  templates --> ctemplates
  ctypes --> ccomponents --> ctemplates
  commerce -. "never imported by" .-> core
  demo --> commerce
  demo --> core
```

- **Tokens:** primitives (raw scales) feed semantic tokens (meaning), which themes override. Components
  read semantic tokens only. See [theming.md](theming.md).
- **Components** are presentational: props in, callbacks out. No fetching, storage, timers (except the
  opt-in Toast auto-dismiss) or clock reads.
- **Templates** compose components inside `SiteLayout` and take a page object plus a render context.
- **Content model and registry:** CMS-agnostic JSON blocks, validated and rendered by `BlockRenderer`.
  Adapters map a CMS's shape into the model. See [content-model.md](content-model.md).
- **Commerce** adds types, pure logic (pricing, cart totals, checkout steps, account rules), components
  and templates. It builds on core and is a separate entry point.
- **Demo** holds Storybook-only providers (in-memory cart, checkout, account) and the clickable demo
  shop. It never ships.

## Dependency rules

```mermaid
flowchart LR
  core["src/ (core)"] -->|may import| core
  commerce["src/commerce"] -->|may import| core
  commerce -->|may import| commerce
  demo["demo/"] -->|may import| core
  demo -->|may import| commerce
  stories[".storybook, *.stories.tsx, tests"] -->|may import| everything["anything"]
  core -.->|never| commerce
  core -.->|never| demo
  commerce -.->|never| demo
```

| Rule | Enforced by |
| --- | --- |
| Core never imports `src/commerce` or `demo/`; nothing under `src/` imports `demo/` | `npm run check:boundaries` |
| Components use semantic tokens only: no primitives, raw or named colours | `npm run check:tokens` |
| Every theme defines every colour token, nothing unknown | `npm run check:themes` |
| No component references a theme by name | `check:tokens` plus review (themes live only in `src/tokens/themes`) |
| The core bundle has no commerce, demo or fixture code; commerce imports core as an external; no storage, cookies or fetch in either bundle | `npm run check:lib` |
| Main stories keep their screenshot tags | `npm run check:story-tags` |
| The component inventory matches the stories | `npm run docs:components -- --check` (in `check:all`) |

## Content flow: CMS to rendered page

```mermaid
sequenceDiagram
  participant CMS
  participant Adapter as Adapter (src/adapters)
  participant Validate as validatePage / checker
  participant Renderer as PageRenderer
  participant Template
  participant Blocks as BlockRenderer
  CMS->>Adapter: entry in the CMS's own shape
  Adapter->>Validate: PageContent JSON (blocks, template, seo)
  Validate-->>Adapter: issues (unknown blocks, unsafe links, missing fields)
  Adapter->>Renderer: page + chrome + ctx
  Renderer->>Template: resolveTemplate(page.template) or default
  Template->>Blocks: page.blocks
  Blocks-->>Template: components per block (unknown or broken blocks are skipped and reported)
  Template-->>Renderer: SiteLayout with header, main and footer
```

- Unsafe URLs (`javascript:`, `data:`) are refused when links and images are rendered.
- Rich text arrives as sanitized HTML (`Prose sanitizedHtml`: the adapter or backend must sanitize) or
  as structured nodes rendered without `dangerouslySetInnerHTML`.
- Problems go to `ctx.onError`; a page never crashes because of one bad block.

## Checkout flow by cart kind

```mermaid
flowchart TD
  cart["Cart"] --> flags{"getCheckoutSteps(flags)"}
  flags -->|"has shippable lines<br/>(physical or mixed)"| info1["Information:<br/>email + shipping address"]
  info1 --> ship["Shipping method"] --> pay1["Payment:<br/>method, billing if different, terms"]
  flags -->|"digital and/or subscription only"| info2["Information:<br/>email + billing address"]
  info2 --> pay2["Payment:<br/>method, terms"]
  pay1 --> sub{"Subscription line?"}
  pay2 --> sub
  sub -->|yes| terms["Renewal terms checkbox required"] --> review["Review"]
  sub -->|no| review
  review --> place["Place order → createOrderFromCart"]
  place --> confirm["Confirmation:<br/>downloads for digital lines,<br/>'Then billed' for subscriptions,<br/>trial lines due today $0"]
```

- Totals always come from `computeCartTotals`; "Due today" excludes trial lines and the "Then billed"
  rows list each renewal.
- Blocking cart issues (sold out, above stock) stop checkout before the first step.
- On narrow screens a sticky bar repeats the total and the step's submit button while the real button
  is out of view (`StickyBuyBar`, tied to the same form with the `form` attribute).
