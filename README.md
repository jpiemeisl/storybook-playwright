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
| Navigation | SkipLink, Header, MobileMenu, Footer, Breadcrumbs, Pagination      |
| Forms      | Label, HelpText, FieldError, Field, Input, Textarea, Select, Checkbox, Radio + RadioGroup, Alert, SearchInput, NewsletterSignup, ContactForm (Button gains `loading`) |
| Sections   | Hero, FeatureGrid, Card + CardGrid, ArticleCard, MediaText, CtaBanner, Stats, Testimonial + TestimonialGrid, LogoStrip, Accordion + FaqSection, PricingTable |

Navigation components take plain data from `src/content-types/navigation.ts` (`NavItem`,
`SocialLink`, `BreadcrumbItem`); map your CMS or router data into those shapes.

- **LinkProvider** injects the element `Link` uses for internal links (e.g. Next.js `Link`). External
  links (absolute http(s) URLs) always render a plain `<a>` with `rel="noopener noreferrer"`.
- **Section** `background="inverse"` sets `data-surface="inverse"`, which remaps the semantic colour
  tokens (see `semantic.css`) so any nested component stays readable.
- **Grid** responds to the width of its own slot via container queries, not the viewport. A numeric
  `columns` value steps down 4 → 3 → 2 → 1 as the slot narrows; pass an object for exact control.
- Items that contain long unbroken strings need a shrinkable track inside them too (e.g.
  `grid-template-columns: minmax(0, 1fr)` on a card); Stack and Grid already let their children shrink.
- **Header** shows the inline nav from 48rem. It also *measures* the nav: whenever the items do not fit
  their slot (long or many labels), it hides the inline nav and shows the menu button instead, at any
  width. Items never wrap or get clipped. Dropdowns are disclosure buttons (Enter/Space, arrows,
  Escape, outside click); there is no hover-only behaviour.
- **MobileMenu** is a native `<dialog>` opened with `showModal()`: focus stays in the dialog (Tab can
  reach the browser chrome, which is the platform behaviour) and the page behind is inert. Page scroll
  is locked while open, and focus returns to the opener on close.
- **Breadcrumbs** and **Pagination** use container queries: below 40rem the trail collapses its
  middle items (still announced) and pagination switches to "Page X of Y" with previous/next.
- All transitions sit inside `@media (prefers-reduced-motion: no-preference)`.

### Forms

Forms are presentational and backend-free: they call `onSubmit(values)` and render the `status`
(`'idle' | 'submitting' | 'success' | 'error'`) they are given. They are built on native controls and
native constraint attributes (`required`, `type`, `minLength`, `pattern`, ...) with no form library.

- **Controls** (Input, Textarea, Select, Checkbox, Radio) work controlled or uncontrolled, accept `ref`
  (React 19 ref-as-prop), and spread other native props onto the native element. States are styled
  from attributes (`aria-invalid`, `:disabled`, `[readonly]`), not classes.
- **Field** wires label `for`/`id`, `aria-describedby` (hint, then error), `aria-invalid`, `required`
  and `aria-required` onto its child control (or passes them to a render prop).
- **Required** fields show a visual `*` hidden from screen readers, which announce the control's
  native `required` state instead. Forms state "Required fields are marked with an asterisk".
- **Validation** (`src/utils/validation.ts`): forms use `noValidate` and validate on submit (then on
  blur), with messages built from each control's `ValidityState`. It also checks `minLength` and
  `maxLength` itself, because browsers only report those for user-typed values. ContactForm shows a
  focused error summary (`role="alert"`) whose links move focus to each field. FieldError is not a live
  region.
- **Textarea counter**: the visible "n / max" is `aria-hidden`; the limit is in the description, and a
  polite live region announces the remaining characters once typing pauses for a second.
- **Button `loading`** keeps the label in layout (so the width does not change), sets `aria-busy` and
  `aria-disabled`, and swallows clicks. It does not use `disabled`, so keyboard focus stays put.
- **Forced colors**: checkbox and radio marks switch to explicit system colours (`Highlight`,
  `FieldText`) under `@media (forced-colors: active)`, and invalid fields get a 2px border.

### Content sections

Section components take the plain shapes in `src/content-types/sections.ts` (rich text is a
`ReactNode` until a Prose component exists). Most are **content blocks**: put them inside
`<Section background="…"><Container>…</Container></Section>`, and they follow that background's
tokens. The exception is `<Hero variant="background">`, which is full-bleed and brings its own
Container, so place it directly in the page.

- **Money** (`src/content-types/money.ts`) is an integer `amount` in minor units plus an ISO
  `currency`. `formatMoney` (`src/utils`) takes the number of minor digits from `Intl` (USD 2,
  JPY 0, KWD 3). Its checks live in the `Utilities/formatMoney` story and run with `test:vrt`.
- **ButtonLink** is a Link (through LinkProvider) styled as a Button. `Link` has an `unstyled` option
  so `className` fully controls the look.
- **Card** with `href`: the title is the only link, and its hit area is stretched over the card. There
  are no nested links, and the focus ring wraps the whole card.
- **Surfaces**: `data-surface="inverse"` remaps colour tokens for a dark area, and
  `data-surface="default"` resets them for a light panel inside one (used by the accent CtaBanner).
- **Accordion** uses the WAI-ARIA button pattern, not `<details>`, for arrow/Home/End navigation
  and a consistent height animation.
- **PricingTable** shows its Monthly/Annual toggle (native radios) when any tier has `annualPrice`.

## Visual regression testing

`tests/visual/stories.spec.ts` reads `storybook-static/index.json` and generates one test per story.
For each viewport it opens the story's iframe and waits for Storybook's `storyFinished` event on the
preview channel. That event fires only after the story has rendered, its `play` function has completed
and the a11y addon has run axe. Then it waits for web fonts and images (lazy images are switched to
eager so full-page shots include them) and takes a screenshot with animations disabled and the caret
hidden. There are no fixed sleeps.

A story **fails** (before any screenshot comparison) if:

- its `play` function throws, including a failed `expect(...)` interaction assertion, or
- axe reports a violation (`parameters.a11y.test` is `'error'` in `.storybook/preview.tsx`), at any of
  the story's viewports.

So interaction tests and accessibility checks run as part of `npm run test:vrt`.

### Choosing viewports

There are two mechanisms. Use tags for the common cases:

| Tag          | Effect                                                         |
| ------------ | -------------------------------------------------------------- |
| _(none)_     | 1280×800 viewport screenshot                                   |
| `vrt-mobile` | Adds a 375×800 screenshot (use for layout-sensitive stories)   |
| `vrt-full`   | Full-page screenshots at 375, 768 and 1280 wide                |
| `skip-vrt`   | Not captured (docs-only stories such as `Playground`)          |

Use the `vrt` parameter when a story needs specific viewports, for example a mobile-only open-menu
state or a desktop-only dropdown. It **replaces** the tag-derived viewports for that story:

```tsx
export const MobileMenuOpen: Story = {
  parameters: { vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => { /* open the menu */ },
};

export const DropdownOpen: Story = {
  parameters: { vrt: { viewports: [{ width: 1280, height: 800, fullPage: true }] } },
};
```

A number means `{ width, height: 800, fullPage: false }`. Parameters are not in `index.json`, so the
harness reads them from the loaded story. The first load (at the tag viewport) is only a probe when a
`vrt` parameter is present, and the story is then reloaded at each requested viewport so play
functions and media queries run at that size.

Play functions in `vrt-full` stories run at 375, 768 and 1280. Write them so they work at every width
(query elements that are visible at all sizes, or use `{ hidden: true }` when only asserting attributes),
or pin the story's viewports with the `vrt` parameter.

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
