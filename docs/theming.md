# Theming

Phase 13 (hand-written). A theme is a set of overrides to the **semantic** token tier and nothing else. Components only ever read semantic tokens (enforced by `npm run check:tokens`), so no component knows a theme exists.

## The three tiers

1. **Primitives** ([`src/tokens/primitives.css`](../src/tokens/primitives.css)): raw scales with no meaning, such as `--neutral-500`, `--teal-600`, `--radius-2` and `--shadow-3`. Components never use them.
2. **Semantic tokens** ([`src/tokens/semantic.css`](../src/tokens/semantic.css)): meaning-based names such as `--color-bg`, `--color-action`, `--radius-control` and `--elevation-high`. This file *is* the default theme, on `:root` and `[data-theme='default']`.
3. **Components** read semantic tokens only. CSS outside `src/tokens/` may not use primitive colour, radius, shadow or font-family tokens, raw colours, or named colours. Forced-colours system colours (`Canvas`, `CanvasText`, `Highlight`, …) are allowed.

Themes ([`src/tokens/themes/`](../src/tokens/themes)) redefine tier 2. Each file looks like this:

```css
@media not print {
  @scope ([data-theme='harbor']) to ([data-theme]) {
    :scope, [data-surface='default'] { color-scheme: dark; --color-bg: #0f1a2b; /* every --color-* … */ }
    [data-surface='inverse'] { color-scheme: light; --color-bg: #e8edf5; /* the inverse palette … */ }
  }
}
```

- **`@scope (…) to ([data-theme])`** applies the theme to its element and descendants, but stops at any nested `[data-theme]`. A harbor section inside an orchard page, or the reverse, uses only its own tokens. Scoped rules also win over the unscoped defaults by proximity, whatever the source order.
- **`[data-surface='inverse']`** inside the scope is that theme's inverse palette: light for harbor, dark green-black for orchard. **`[data-surface='default']`** returns to the theme's own palette (used, for example, by the accent CtaBanner inside an inverse region).
- **`@media not print`:** see Print below.

## Semantic token contract

Every theme must define **all** `--color-*` tokens explicitly, in its palette and in its inverse surface rule, so nothing can silently inherit light-on-light or dark-on-dark values. Shape, depth and type tokens may inherit the default values. `npm run check:themes` enforces this. It also rejects tokens the default theme doesn't have and references to primitives that don't exist.

The "used by" column lists the components whose CSS reads each token (generated from the stylesheets).

| Token | Required per theme | Used by (examples) |
| --- | --- | --- |
| `--color-bg` | yes | AnnouncementBar, CtaBanner, Header, Hero +2 more |
| `--color-bg-subtle` | yes | ActiveFilters, AnnouncementBar, Card, CtaBanner +9 more |
| `--color-bg-muted` | yes | AccountNav, Alert, AnnouncementBar, Badge +24 more |
| `--color-surface` | yes | AuthForm, AuthTemplate, AuthorByline, Button +35 more |
| `--color-bg-accent-subtle` | yes | AnnouncementBar, CtaBanner, Section |
| `--color-bg-inverse` | yes | VideoEmbed |
| `--color-border` | yes | Accordion, AccountNav, AccountTemplates, AddressBook +52 more |
| `--color-border-strong` | yes | ActiveFilters, BlockRenderer, CheckoutStepper, EmptyState +10 more |
| `--color-text` | yes | Accordion, AccountNav, ActiveFilters, Alert +69 more |
| `--color-text-muted` | yes | Accordion, AccountTemplates, AddToCart, AddressForm +65 more |
| `--color-text-subtle` | yes | Breadcrumbs, CollectionCard, ProductCard, Text |
| `--color-text-inverse` | yes | VideoEmbed |
| `--color-action` | yes | Accordion, AccountNav, ActiveFilters, AuthorByline +42 more |
| `--color-action-hover` | yes | Button, Header, MobileMenu, Prose +2 more |
| `--color-action-active` | yes | Button |
| `--color-action-text` | yes | Button, Checkbox, CheckoutStepper, Header +7 more |
| `--color-action-subtle` | yes | AuthorByline, Badge, Button, FeatureGrid +2 more |
| `--color-action-subtle-hover` | yes | Button |
| `--color-link` | yes | Link |
| `--color-link-hover` | yes | Link |
| `--color-disabled-bg` | yes | AddToCart, Button, Pagination |
| `--color-disabled-text` | yes | AddToCart, Button, Carousel, FilterPanel +4 more |
| `--color-disabled-border` | yes | AddToCart, Button, Pagination |
| `--color-focus-ring` | yes | Accordion, AccountNav, ActiveFilters, Alert +50 more |
| `--color-danger` | yes | AddToCart, AddressBook, Alert, Badge +13 more |
| `--color-danger-subtle` | yes | Alert, Badge, BlockRenderer, CartLineItem +2 more |
| `--color-success` | yes | AddToCart, Alert, AuthForm, Badge +8 more |
| `--color-success-subtle` | yes | Alert, Badge, FreeShippingProgress |
| `--color-warning` | yes | Alert, CartLineItem, QuantityStepper, StatusBadge +2 more |
| `--color-warning-subtle` | yes | Alert, CartLineItem, StatusBadge |
| `--color-info` | yes | Alert, DeliveryInfo, StockBadge, Toast |
| `--color-info-subtle` | yes | Alert, DeliveryInfo |
| `--color-sale` | yes | Price, SaleBadge, WishlistButton |
| `--color-rating` | yes | Rating, Reviews |
| `--color-field-bg` | yes | Checkbox, QuantityStepper, Radio, Select +1 more |
| `--color-field-border` | yes | AuthForm, Carousel, Checkbox, LicenseKey +7 more |
| `--color-field-border-hover` | yes | Checkbox, Radio, fieldBox |
| `--color-field-border-focus` | yes | fieldBox |
| `--color-field-disabled-bg` | yes | Checkbox, Radio, fieldBox |
| `--color-code-bg` | yes | Prose |
| `--color-code-text` | yes | Prose |
| `--color-quote-border` | yes | Prose |
| `--color-table-header-bg` | yes | Prose, Table |
| `--color-table-stripe` | yes | Table |
| `--color-scroll-shadow` | yes | Table |
| `--text-font-body` | no (inherits) | Badge, Button, Price, Text |
| `--text-font-heading` | no (inherits) | Heading, Prose |
| `--text-weight-heading` | no (inherits) | Heading, Price, PricingTable, Prose +5 more |
| `--letter-spacing-heading` | no (inherits) | Heading |
| `--radius-control` | no (inherits) | AccountNav, Alert, AnnouncementBar, AuthForm +40 more |
| `--radius-surface` | no (inherits) | AddressBook, AuthTemplate, AuthorByline, BlockRenderer +25 more |
| `--radius-pill` | no (inherits) | ActiveFilters, Badge, CheckoutStepper, FilterPanel +14 more |
| `--radius-round` | no (inherits) | ArticleCard, AuthorByline, Button, Carousel +6 more |
| `--radius-inline` | no (inherits) | Link, Prose |
| `--border-width-control` | no (inherits) | Button, fieldBox |
| `--border-width-card` | no (inherits) | Card |
| `--elevation-low` | no (inherits) | Toast |
| `--elevation-mid` | no (inherits) | Card, Header, MapEmbed, SkipLink |
| `--elevation-high` | no (inherits) | FilterDrawer, MiniCart, MobileMenu, Modal +3 more |
| `--color-overlay` | yes | FilterDrawer, MiniCart, MobileMenu, Modal |
| `--color-overlay-media` | yes | Hero, VideoEmbed |

Inverse surfaces remap the colour tokens in the default theme's `[data-surface='inverse']` rule, plus `--logo-filter-muted`. Each theme's inverse rule must define the same set.

## Writing a theme

1. **Copy a theme file:** copy `src/tokens/themes/orchard.css` (light) or `harbor.css` (dark) to `src/tokens/themes/<name>.css` and replace the name in the `@scope` selector.
2. **Define every colour:** set every `--color-*` token in the palette rule, then every inverse token in the `[data-surface='inverse']` rule. Set `color-scheme` in both, so native controls, scrollbars and form popups match.
3. **Override shape and type only if you need to:** for example `--radius-control`, `--radius-surface`, `--border-width-control`, `--elevation-*`, `--text-font-heading`, `--text-weight-heading` and `--letter-spacing-heading`. Fonts must be system stacks: no web fonts, no network requests.
4. **Register it:**
   - import the file in [`src/tokens/index.css`](../src/tokens/index.css) with `layer(tokens)`
   - add it to `themes` in [`src/components/Theme/themes.ts`](../src/components/Theme/themes.ts), which is the one list the toolbar, the harness, the tests and docs read
5. **Run the checks:** `npm run check:themes`, `npm run test:unit` (the contrast tests run for every listed theme) and `npm run test:a11y`.

### Contrast requirements

[`src/tokens/__tests__/contrast.test.ts`](../src/tokens/__tests__/contrast.test.ts) resolves the `var()` chains for each theme from the CSS files themselves. It checks each pair on the page and on the inverse surface, compositing translucent colours over their background:

| Pair | Minimum |
| --- | --- |
| text on bg, bg-subtle, bg-muted, surface, accent-subtle; muted text on bg, bg-subtle and surface; subtle text on bg | 4.5:1 |
| action-text on action, action-hover and action-active | 4.5:1 |
| action and link as text on bg (and surface, subtle, action-subtle) | 4.5:1 |
| focus ring on bg and surface; field border on field bg and page bg; focused field border; border-strong on bg; quote rule | 3:1 |
| danger, success, warning and info on bg and on their subtle backgrounds; alert body text | 4.5:1 |
| sale price (text) on bg and surface | 4.5:1 |
| rating stars (graphical) on bg and surface | 3:1 |
| code text on code bg; text on table header | 4.5:1 |
| text-inverse on bg-inverse; inverse region vs page | 4.5:1; 3:1 |
| inverse text over the media scrim, on a white **and** a black image (Hero) | 4.5:1 |

- **Exempt:** disabled tokens (`--color-disabled-*`), per WCAG 1.4.3, so they're listed but not checked.
- **Not checked:** the modal scrim (`--color-overlay`). Text never sits on it: dialogs have their own surface.
- **On failure** the test prints a table of every failing pair with its ratio.

## Applying themes in a host app

- **Any element:** `data-theme="harbor"` on `<html>` themes the page; on any element it themes that subtree, and themes nest. Themed elements paint their own `--color-bg` and `--color-text` (`base.css`).
- **The Theme component:** `<Theme name="orchard" as="section">…</Theme>` renders exactly one element with `data-theme`. It has no effects and no storage, and it's safe to server-render.
- **Your own overrides:** put tweaks in the `overrides` layer, which wins over `tokens`:
  ```css
  @layer overrides { [data-theme='harbor'] { --color-action: #ffb84d; } }
  ```
  Keep the contrast requirements in mind.
- **Choosing a theme is the host's job.** The library never stores a choice and never reads `prefers-color-scheme`. To follow the system setting or remember a user's choice, do it in the host:
  ```ts
  // Host app, not the library: respect a saved choice, else the system setting.
  const saved = localStorage.getItem('theme'); // your storage, your consent rules
  const theme = saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'harbor' : 'default');
  document.documentElement.dataset.theme = theme;
  ```
  Run it before first paint (an inline script in `<head>`) to avoid a flash of the wrong theme.
- **Browser support:** themes use CSS `@scope`. Browsers without it ignore the theme rules and render the default theme.

## Shipping themes to consumers

Each theme file is standalone CSS that depends only on the semantic token names. A consumer can import `tokens/index.css` (default plus every theme), or the default tokens plus only the theme files they use. Theme files carry no component CSS.

## Print

Printed pages always use the default theme. Theme rules sit inside `@media not print`, so in print every element falls back to the default palette and a dark theme never prints as a black page. This replaces a separate print reset block, which would have had to duplicate the whole default palette.

## Storybook and tests

- **Toolbar:** the **Theme** toolbar (the `theme` global) wraps every story in `<Theme>` and sets `data-theme` on `<html>`. In URLs it's `&globals=theme:harbor`. The backgrounds tool is disabled.
- **Visual tests:** stories tagged `theme-smoke` are captured in every non-default theme at 1280 and 375 px (and 768 px when also `vrt-full`), named `<id>-<width>-<theme>.png`. Default-theme names are unchanged. `parameters.vrt.themes` overrides the list for one story.
- **`npm run test:a11y`:** runs every smoke story in every theme at 1280 px, the demo shop checkpoints in every theme at 1280 and 375 px (Phase 14), and every story once in the default theme, and fails on any axe violation reported by Storybook's a11y addon, including colour contrast. That reuses the axe the addon already ships, so it needs no new dependency.
- **New stories:**
  - **Foundations/Theme comparison:** swatches, type, radii, shadows, borders and the focus ring, per theme.
  - **Themes/Component gallery:** the cheap regression guard, showing the same components in each theme.
  - **Themes/Nested:** nested themes, and every Section background in every theme.

### Theme smoke set

- **Foundations and primitives:** Foundations/Tokens Colors, Button Sizes, Forms kitchen sink, Alert Tones, Toast Matrix, Badge Tones, Status badges
- **Navigation:** Header Default, Header Dropdown Open, MobileMenu Open, Footer Four Columns
- **Content:** Card Grid, PricingTable Monthly, Accordion Several Expanded, Tabs Default, Modal Open, Table Striped
- **Templates:** Home, Blog Post, Error 404
- **Commerce:** ProductCard Matrix, Product detail (physical with variants), Cart Mixed, Checkout Mixed Payment, Order confirmation Mixed, Account dashboard (rich), ManageSubscription Cancel Dialog, Login

## Gallery

| Theme | Intent |
| --- | --- |
| **default** | Light, neutral greys with a deep teal action. The baseline every theme overrides. |
| **harbor** | Dark ink navy with an amber action (dark text on it), a bright cyan focus ring, small radii, 2px control borders and borders instead of soft shadows. Inverse regions are a light surface, so they still contrast with the page. |
| **orchard** | Light and editorial: paper white with a faint sage tint, deep green-black text, a plum action, pale lilac accents, generous radii, soft low shadows and a system serif for headings (Georgia, Iowan Old Style, Palatino). Inverse regions are dark green-black. |

## Gap report

What building two real themes showed about the token architecture.

### Components that needed token changes

The audit (`npm run check:tokens`) found 19 primitive references, all radius tokens. Reviewing the two themes by eye found the rest. All of these were fixed with new semantic tokens; no component reads a theme name.

| Component | Was | Now |
| --- | --- | --- |
| Pills, avatars, dots, toggles (14 places) | `--radius-full` | `--radius-round` |
| Inline code, Prose, Checkbox (5 places) | `--radius-1`, `--radius-2` | `--radius-inline`, `--radius-control` |
| Link and base `a` | action colour reused for links | `--color-link`, `--color-link-hover` (separate inverse values) |
| Input, Select, Textarea (fieldBox), Button | fixed 1px border | `--border-width-control` (harbor uses 2px) |
| Card | fixed 1px border | `--border-width-card` |
| Heading and base h1–h6 | font family only | `--text-font-heading` on base headings, `--letter-spacing-heading` |
| `color-scheme` | declared once on `:root` | part of each palette, so inverse surfaces switch native controls too |

Contrast tests then added `--neutral-450` (primitive) for the default `--color-border-strong`, which was 2.57:1 and is now 3.4:1 on white, and `--color-bg-accent-subtle` to every inverse palette.

**Allowlist:** [`scripts/check-tokens.allow.json`](../scripts/check-tokens.allow.json) is empty. No exceptions were needed.

**Semantic tokens added in this phase:** `--color-link`, `--color-link-hover`, `--radius-round`, `--radius-inline`, `--border-width-control`, `--border-width-card` and `--letter-spacing-heading`. `--color-bg-accent-subtle` and `--color-overlay-media` are now defined on inverse surfaces too.

### Known limitations

- **Fixture images are light.** The demo product and blog illustrations have pale backgrounds, so they're bright on harbor. That's content, not tokens; a real dark-theme site would supply suitable imagery.
- **`@scope` support.** Browsers without CSS `@scope` (check current support for your audience; older Firefox and Safari releases lack it) ignore theme rules and show the default theme. That's safe but not themed.
- **Harbor headings** use weight 800. On Segoe UI that renders as Black; on stacks without an 800 weight it falls back to bold.
- **Print** is always the default theme, by design.

### Workarounds to review

- **`@scope (…) to ([data-theme])`** instead of plain `[data-theme='x']` blocks. Plain blocks leak into nested themes (an inverse rule in an outer theme beats a nested theme's palette). `@scope` stops at the boundary and wins by proximity.
- **`@media not print`** around each theme instead of a print reset that repeats the default palette.
- **Harbor's media scrim** (`--color-overlay-media` on the inverse surface) is light, because harbor's inverse text is dark. The Hero contrast test covers it over white and black images.
- **a11y without a new dependency.** `test:a11y` reads the axe results Storybook's a11y addon already produces, instead of adding `@axe-core/playwright`. The trade-off: rules and options come from the addon's configuration.
- **Token names kept.** Elevation and surface tokens keep their existing names (`--elevation-*`, `--color-surface*`) rather than being renamed to `--shadow-card` and similar, to avoid churn in every component.
- **ManageSubscription Cancel Dialog** is the dialog smoke story because it opens the modal in its play function.
- **The 1% diff threshold** hides the default `--color-border-strong` change (neutral-400 to neutral-450): no default baseline was rewritten, though the pixels changed slightly.

### Forced colours

In forced-colours mode the browser replaces author colours, so every theme looks the same, and that's intended. The components' `@media (forced-colors: active)` rules use system colours only (`Highlight`, `CanvasText`, `ButtonText`), never tokens, so themes can't break them. Checked in Chromium with forced-colours emulation for default, harbor and orchard (Forms kitchen sink, Component gallery, ProductCard matrix, Header dropdown): those rules apply in every theme, and selected checkboxes, radios and option cards are marked with `Highlight`, not colour alone. Chromium's emulation doesn't repaint author colours, so a final check in Windows contrast themes is still worth doing by hand.
