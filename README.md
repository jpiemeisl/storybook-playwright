# storybook-playwright

A React component pattern library: Vite + React + TypeScript (strict), documented in Storybook and
protected by Playwright visual regression tests that run against every story.

## Setup

Requires Node 20.19+ (developed on Node 24).

```sh
npm install
npx playwright install chromium
```

## Scripts

| Script                    | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run typecheck`       | `tsc --noEmit` over src, .storybook, tests and config files                  |
| `npm run storybook`       | Storybook dev server on http://localhost:6006                                |
| `npm run build-storybook` | Static Storybook build into `storybook-static/`                              |
| `npm run test:vrt`        | Builds Storybook, then compares every story against the committed baselines  |
| `npm run test:vrt:update` | Builds Storybook, then rewrites the baselines                                |
| `npm run test:vrt:report` | Opens the HTML report from the last run (diffs for any failures)             |

## Project layout

```
.storybook/           Storybook config; preview wraps stories in <div data-theme="default">
src/tokens/           Design tokens and global CSS
  index.css           Declares layer order: reset, tokens, base, components, overrides
  primitives.css      Tier 1: raw scales (colour, spacing, type, radii, shadows)
  semantic.css        Tier 2: meaning-based aliases. Themes override this tier only
  Foundations.stories.tsx
src/components/       One folder per component: .tsx, .module.css, .stories.tsx, index.ts
src/index.ts          Public entry point; re-exports every component barrel
src/fixtures/images/  Local deterministic placeholder images for stories (no remote URLs)
src/stories/          Story-only helpers (Placeholder, Ruler); not exported
tests/visual/         Playwright VRT spec and committed baselines (__screenshots__/)
```

Rules: components use **semantic tokens only**, never primitives, and logical properties
(`margin-inline`, `padding-block`, ...). Component CSS lives in `@layer components { ... }` inside a
CSS Module. No runtime CSS-in-JS, no localStorage, no browser globals at render time, no data
fetching in components.

### Components

| Group      | Components                                                         |
| ---------- | ------------------------------------------------------------------ |
| Primitives | Button, Text, Heading, Link (+ LinkProvider), Icon, Image, Badge, Divider |
| Layout     | Container, Section, Stack, Grid                                    |

- **LinkProvider** injects the element `Link` uses for internal links (e.g. Next.js `Link`). External
  links (absolute http(s) URLs) always render a plain `<a>` with `rel="noopener noreferrer"`.
- **Section** `background="inverse"` sets `data-surface="inverse"`, which remaps the semantic colour
  tokens (see `semantic.css`) so any nested component stays readable.
- **Grid** responds to the width of its own slot via container queries, not the viewport. A numeric
  `columns` value steps down 4 → 3 → 2 → 1 as the slot narrows; pass an object for exact control.
- Items that contain long unbroken strings need a shrinkable track inside them too (e.g.
  `grid-template-columns: minmax(0, 1fr)` on a card); Stack and Grid already let their children shrink.

## Visual regression testing

`tests/visual/stories.spec.ts` reads `storybook-static/index.json` and generates one test per story.
Each test opens the story's iframe, waits for the render (and any play function), web fonts and images
(lazy images are switched to eager so full-page shots include them), then takes a screenshot with
animations disabled and the caret hidden. Stories that need focus or other interaction use a `play`
function; the harness waits for it to finish.

Control what gets captured with story tags:

| Tag          | Effect                                                         |
| ------------ | -------------------------------------------------------------- |
| _(none)_     | 1280×800 viewport screenshot                                   |
| `vrt-mobile` | Adds a 375×800 screenshot (use for layout-sensitive stories)   |
| `vrt-full`   | Full-page screenshots at 375, 768 and 1280 wide                |
| `skip-vrt`   | Not captured (docs-only stories such as `Playground`)          |

Baselines live in `tests/visual/__screenshots__/` and are named `<story-id>-<width>.png`. They have no
platform suffix because they are generated on a single Windows machine; screenshots from another OS
will differ in font rendering, so regenerate them on the machine that runs the tests.

### Reviewing a failure

1. `npm run test:vrt`
2. `npm run test:vrt:report` and open the failing test. The report shows expected, actual and a diff
   (use the slider or "Diff" view).
3. If the change is a bug, fix it and re-run. If it is intended, update the baselines.

### Updating baselines

```sh
npm run test:vrt:update
git diff --stat tests/visual/__screenshots__
```

Review the changed PNGs (your Git client or GitHub's image diff) and commit them together with the code
change that caused them, so each baseline update is reviewable alongside its cause.

`--update-snapshots` only rewrites baselines that currently fail, so changes inside the 1% tolerance
(e.g. a slightly darker grey) are left stale. After a token change, rewrite everything:

```sh
npm run build-storybook
npx playwright test --update-snapshots=all
```
