# Theming

A theme is a set of overrides to the **semantic** token tier and nothing else. Component CSS only
reads semantic tokens (enforced by `npm run check:tokens`), so no component knows a theme exists.

## The three tiers

1. **Primitives** ([`src/tokens/primitives.css`](../src/tokens/primitives.css)): raw scales with no meaning, such as `--neutral-500`, `--teal-600`, `--radius-2` and `--shadow-3`. Components never use them.
2. **Semantic tokens** ([`src/tokens/semantic.css`](../src/tokens/semantic.css)): meaning-based names such as `--color-bg`, `--color-action`, `--radius-control` and `--elevation-high`. This file *is* the default theme, on `:root` and `[data-theme='default']`.
3. **Components** read semantic tokens only. `npm run check:tokens` scans every CSS file outside `src/tokens/` (in `src/`, `demo/` and `.storybook/`) and rejects primitive color, radius, shadow and font-family tokens, raw colors (`#hex`, `rgb()`, `hsl()`, …) and named colors. `transparent`, `currentColor` and the system colors used under `forced-colors` (`Canvas`, `CanvasText`, `Highlight`, …) are allowed. Exceptions go in [`scripts/check-tokens.allow.json`](../scripts/check-tokens.allow.json), each with a reason; it is empty.

Themes ([`src/tokens/themes/`](../src/tokens/themes)) redefine tier 2. Each file looks like this:

```css
@media not print {
  @scope ([data-theme='harbor']) to ([data-theme]) {
    :scope, [data-surface='default'] { color-scheme: dark; --color-bg: #0f1a2b; /* every --color-* … */ }
    [data-surface='inverse'] { color-scheme: light; --color-bg: #e8edf5; /* the inverse palette … */ }
  }
}
```

- **`@scope (…) to ([data-theme])`** applies the theme to its element and descendants, but stops at any nested `[data-theme]`. A `harbor` section inside an `orchard` page, or the reverse, uses only its own tokens. Scoped rules also win over the unscoped defaults by proximity, whatever the source order.
- **`[data-surface='inverse']`** inside the scope is that theme's inverse palette: light for `harbor`, dark green-black for `orchard`. **`[data-surface='default']`** returns to the theme's own palette (used, for example, by the accent CtaBanner inside an inverse region).
- **`@media not print`:** see [Print](#print).

## Semantic token contract

`npm run check:themes` ([`scripts/check-theme-contract.mjs`](../scripts/check-theme-contract.mjs)) checks every file in `src/tokens/themes/`:

- It is scoped to `[data-theme='<file name>']` and has a palette rule (`:scope, [data-surface='default']`) that sets `color-scheme`.
- The palette rule defines **every** `--color-*` token of the default theme, so nothing can silently inherit light-on-light or dark-on-dark values. Shape, depth and type tokens (radii, border widths, elevation, fonts) may inherit the default values.
- Its `[data-surface='inverse']` rule defines every token the default theme's inverse rule remaps: the color tokens plus `--logo-filter-muted`.
- It defines no token the default theme doesn't have, and references only primitives and semantic tokens that exist.

The full list of semantic tokens is generated in [api-surface.md](api-surface.md#css).

## Writing a theme

1. **Copy a theme file:** copy `src/tokens/themes/orchard.css` (light) or `harbor.css` (dark) to `src/tokens/themes/<name>.css` and replace the name in the `@scope` selector.
2. **Define every color:** set every `--color-*` token in the palette rule, then every inverse token in the `[data-surface='inverse']` rule. Set `color-scheme` in both, so native controls, scrollbars and form popups match.
3. **Override shape and type only if you need to:** for example `--radius-control`, `--radius-surface`, `--border-width-control`, `--elevation-*`, `--text-font-heading`, `--text-weight-heading` and `--letter-spacing-heading`. Fonts must be system stacks: no web fonts, no network requests.
4. **Register it:**
   - import the file in [`src/tokens/index.css`](../src/tokens/index.css) with `layer(tokens)`
   - add it to `themes` in [`src/components/Theme/themes.ts`](../src/components/Theme/themes.ts), which is the one list the toolbar, the tests and the docs read
   - add a `./themes/<name>.css` entry to `exports` in `package.json`
5. **Run the checks:** `npm run check:themes`, `npm run test:unit` (the contrast tests run for every listed theme) and `npm run test:a11y:docker`.

### Contrast requirements

[`src/tokens/__tests__/contrast.test.ts`](../src/tokens/__tests__/contrast.test.ts) resolves the `var()` chains for each theme from the CSS files themselves. It checks each pair on the page and on the inverse surface, compositing translucent colors over their background:

| Pair | Minimum |
| --- | --- |
| text on bg, bg-subtle, bg-muted, surface, bg-accent-subtle and field-bg; muted text on bg, bg-subtle and surface; subtle text on bg | 4.5:1 |
| action-text on action, action-hover and action-active | 4.5:1 |
| action as text on bg, surface and action-subtle; link on bg and bg-subtle; link-hover on bg | 4.5:1 |
| focus ring on bg and surface; field border on field-bg and bg; focused field border on field-bg; border-strong on bg; quote border on bg | 3:1 |
| danger, success, warning and info on bg and on their subtle backgrounds; text on danger-subtle and warning-subtle | 4.5:1 |
| sale (text) on bg and surface | 4.5:1 |
| rating stars (graphical) on bg and surface | 3:1 |
| code text on code bg; text on table header bg | 4.5:1 |

Per theme, on the page only: text-inverse on bg-inverse 4.5:1; bg against bg-inverse (an inverse region against the page) 3:1; inverse text over the media scrim (`--color-overlay-media`), on a white **and** a black image (Hero), 4.5:1.

- **Exempt:** disabled tokens (`--color-disabled-*`), per WCAG 1.4.3.
- **Not checked:** the modal scrim (`--color-overlay`). Text never sits on it: dialogs have their own surface.
- **On failure** the test prints a table of every failing pair with its ratio.

## Applying themes in a host app

- **Any element:** `data-theme="harbor"` on `<html>` themes the page; on any element it themes that subtree, and themes nest. Themed elements paint their own `--color-bg` and `--color-text` (`src/tokens/base.css`).
- **The Theme component:** `<Theme name="orchard" as="section">…</Theme>` renders exactly one element with `data-theme`. It has no effects and no storage, and it's safe to server-render.
- **Your own overrides:** put tweaks in the `overrides` layer, which wins over `tokens`:
  ```css
  @layer overrides { [data-theme='harbor'] { --color-action: #ffb84d; } }
  ```
  Keep the contrast requirements in mind.
- **Choosing a theme is the host app's job.** The library never stores a choice and never reads `prefers-color-scheme`. To follow the system setting or remember a user's choice, do it in the host app:
  ```ts
  // Host app, not the library: respect a saved choice, else the system setting.
  const saved = localStorage.getItem('theme'); // your storage, your consent rules
  const theme = saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'harbor' : 'default');
  document.documentElement.dataset.theme = theme;
  ```
  Run it before first paint (an inline script in `<head>`) to avoid a flash of the wrong theme.
- **Browser support:** themes use CSS `@scope`. Browsers without it ignore the theme rules and show the default theme everywhere: safe, but not themed.

## Shipping themes

Each theme file is standalone CSS that depends only on the semantic token names and carries no component CSS. `@jpiemeisl/pattern-library/tokens.css` includes the default theme and every other theme; a host app can instead load the token parts plus only the theme files it uses (`@jpiemeisl/pattern-library/themes/<name>.css`). The entry points and the CSS load order are in [consuming.md](consuming.md#css).

## Print

Printed pages always use the default theme. Theme rules sit inside `@media not print`, so in print every element falls back to the default palette and a dark theme never prints as a black page.

## Forced colors

In forced-colors mode the browser replaces author colors, so every theme looks the same, and that's intended. The components' `@media (forced-colors: active)` rules use system colors only (`Highlight`, `CanvasText`, `ButtonText`, …), never tokens, so themes can't break them. Selected checkboxes, radios and option cards are marked with `Highlight`, not color alone.

## Storybook and tests

- **Toolbar:** the **Theme** toolbar (the `theme` global) wraps every story in `<Theme>` and sets `data-theme` on `<html>`. In URLs it's `&globals=theme:harbor`. The backgrounds tool is disabled.
- **Visual tests:** stories tagged `theme-smoke` are also captured in every non-default theme at 1280 and 375 px (and 768 px when also tagged `vrt-full`), named `<id>-<width>-<theme>.png`. Default-theme names are unchanged. `parameters.vrt.themes` overrides the list for one story. Which stories carry the tag is in the tags column of [COMPONENTS.md](COMPONENTS.md); the demo shop's stories carry it too. See [testing.md](testing.md).
- **Accessibility tests** (`npm run test:a11y:docker`): every `theme-smoke` story in every theme at 1280 px, the demo shop checkpoints in every theme at 1280 and 375 px, and every story once in the default theme. Any axe violation reported by Storybook's a11y addon fails the test, including color contrast.
- **Theme stories:**
  - **Foundations/Theme comparison:** swatches, type, radii, shadows, borders and the focus ring, per theme.
  - **Themes/Component gallery:** the same components in each theme, a cheap regression guard.
  - **Themes/Nested:** nested themes, and every Section background in every theme.

## Gallery

The descriptions come from [`src/components/Theme/themes.ts`](../src/components/Theme/themes.ts), with details from the theme files.

| Theme | Intent |
| --- | --- |
| `default` | Light, neutral grays with a deep teal action. The baseline every theme overrides. |
| `harbor` | Dark ink navy with an amber action (dark text on it), a bright cyan focus ring, small radii, 2px control borders and 1px outlines for elevation in place of soft shadows (the highest level adds a drop shadow). Inverse regions are a light surface, so they still contrast with the page. |
| `orchard` | Light and editorial: sage-tinted paper white, deep green-black text, a plum action, pale lilac accents, generous radii, soft low shadows and a system serif for headings (Georgia, Iowan Old Style, Palatino Linotype). Inverse regions are dark green-black. |
