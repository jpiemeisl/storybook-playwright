# storybook-playwright

A React pattern library for content sites and small shops: presentational components, page templates, a
CMS-agnostic content model, an optional commerce layer and themes, documented in Storybook and protected
by Playwright visual regression and accessibility tests that run against every story. Built with Vite,
React and strict TypeScript. The package is private and unpublished; `npm run build:lib` verifies that
it builds as a library.

**Status:** phases 1 to 14 are done. Open items are in [docs/ROADMAP.md](docs/ROADMAP.md), and the history of
every gap in [docs/GAPS.md](docs/GAPS.md).

## Quickstart

Requires Node 20.19+ (developed on Node 24).

```sh
npm install
npx playwright install chromium
npm run storybook          # http://localhost:6006; start at "Demo shop / Checkpoints / Home"
npm run check:all          # types, rules, library build, unit tests, Storybook build
```

The **demo shop** (`Demo shop/Checkpoints/Home`) is a complete, clickable shop assembled only from
library pieces: browse, filter, add to cart, check out, sign in (demo customer `robin@example.com`, any
password) and manage subscriptions. Switch the theme in the toolbar to restyle all of it.

## Principles

- **Presentational components.** Props in, callbacks out. No fetching, storage, cookies, timers (except
  the opt-in Toast auto-dismiss) or clock reads in `src/`; dates come in as `now`.
- **Token tiers.** Primitives → semantic tokens → themes. Components read semantic tokens only
  (`check:tokens`); a theme overrides semantic tokens and nothing else ([docs/theming.md](docs/theming.md)).
- **CMS-agnostic content model.** Pages are JSON blocks validated and rendered by the registry; adapters
  map a CMS into that shape ([docs/content-model.md](docs/content-model.md)).
- **Commerce separation.** `src/commerce` builds on core and is its own entry point; core never imports
  it (`check:boundaries`, `check:lib`).
- **Demo-only providers.** In-memory cart, checkout and account providers and the demo shop live in
  `demo/`. They never ship and nothing in `src/` imports them.

How the pieces fit: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). How to add to them:
[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). Every component: [docs/COMPONENTS.md](docs/COMPONENTS.md).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run storybook` | Storybook dev server on http://localhost:6006 |
| `npm run build-storybook` | Static Storybook build into `storybook-static/` |
| `npm run check:all` | Everything except the browser suites: typecheck, boundaries, tokens, themes, Storybook build, story tags, components doc, library build and check, unit tests |
| `npm run typecheck` | `tsc --noEmit` over src, demo, .storybook, tests, scripts and config files |
| `npm run check:boundaries` | Fails if core imports `src/commerce`, or anything under `src/` imports `demo/` |
| `npm run check:tokens` | Fails if CSS outside `src/tokens` uses primitive colour, radius, shadow or font tokens, or raw colours (allowlist: `scripts/check-tokens.allow.json`, empty) |
| `npm run check:themes` | Fails if a theme misses a colour token, adds unknown tokens or references a missing primitive |
| `npm run check:story-tags` | After a Storybook build: fails when a main story lacks its expected screenshot tags |
| `npm run build:lib` | Library build into `dist/`: core and commerce ES modules, CSS, token and theme CSS, type declarations |
| `npm run check:lib` | After `build:lib`: no commerce, demo or fixture code in core; commerce imports core as an external; no storage, cookie or fetch use; every export declared; bundle sizes |
| `npm run docs:components` | Regenerates [docs/COMPONENTS.md](docs/COMPONENTS.md) from the Storybook index (`-- --check` fails when stale) |
| `npm run docs:content-model` | Regenerates [docs/content-model.md](docs/content-model.md) from the content-type JSDoc |
| `npm run test:unit` | Vitest unit tests for pure logic (validators, registry, adapters, commerce logic, demo reducers, router) |
| `npm run test:vrt` | Builds Storybook, then compares every story with the committed baselines (play functions and axe run too) |
| `npm run test:vrt:update` | Builds Storybook, then rewrites failing or missing baselines |
| `npm run test:vrt:smoke` | Builds Storybook, then only `theme-smoke` and `vrt-full` stories, default theme, 1280 px |
| `npm run test:vrt:changed -- "<pattern>"` | Builds Storybook, then only tests whose title matches (e.g. a story title prefix) |
| `npm run test:vrt:flaky -- "<pattern>"` | No build: runs matching tests five times each with no retries, to expose flaky stories |
| `npm run test:vrt:report` | Opens the HTML report from the last run |
| `npm run test:a11y` | Builds Storybook, then axe on every story (default theme), the theme smoke set in every theme, and the demo shop checkpoints in every theme at 1280 and 375 px |

## Release checklist

1. `npm run check:all`
2. `npm run test:vrt`: must pass with zero diffs. Inspect any baseline you changed on purpose.
3. `npm run test:a11y`
4. Update the docs the change touches (component JSDoc, `docs/*.md`, [docs/GAPS.md](docs/GAPS.md)).
5. Commit baselines together with the change that caused them; never merge a PR with unexplained
   baseline changes.

## Project layout

```
.storybook/           Storybook config: theme toolbar and decorator, a11y addon set to fail on violations
src/tokens/           Design tokens and global CSS: primitives, semantic tokens (the default theme), themes/
src/components/       Core components: one folder each (.tsx, .module.css, .stories.tsx, index.ts)
src/templates/        SiteLayout, PageRenderer, the template registry and page templates
src/content-types/    JSON-only content model (blocks, pages, site chrome) a CMS adapter produces
src/component-types/  Component prop shapes that may contain ReactNode
src/registry/         Block registry, BlockRenderer, validators and link safety
src/adapters/         Example CMS adapter (reference only; not exported)
src/commerce/         Commerce entry: types, pure logic, components, templates, fixtures
src/fixtures/         Page, block and chrome fixtures (JSON) and local placeholder images
src/stories/          Story-only helpers; not exported
src/index.ts          Core entry point (src/commerce/index.ts is the commerce entry)
demo/commerce/        Demo-only providers: in-memory cart, checkout and account
demo/shop/            Demo shop: in-memory router, link and form interception, routes, journeys
scripts/              Checks (boundaries, tokens, themes, story tags, library) and doc generators
tests/visual/         Visual spec, committed baselines (__screenshots__/), full-page capture CSS
tests/a11y/           Accessibility specs (all stories, themes, demo shop)
tests/support/        Shared Storybook helpers for the specs
docs/                 Architecture, contributing, components, theming, commerce, templates, roadmap, gaps
```

## Out of scope

Real authentication, payments, tax, address lookup, data fetching, analytics and consent storage are
the host application's job. The library gives them UI, types and callbacks. The CookieBanner is UI
only and not legal advice: the host stores the visitor's choice, applies it and owns compliance. No
CSS-in-JS, web fonts, animation libraries or runtime dependencies beyond React.

## Components and blocks

Phase 14 additions:

- **CookieBanner** (core): a non-modal, labelled region with "Accept all" and "Reject all" given equal weight and "Choose settings" (a Modal with the host's `ConsentCategory[]`; required categories always on). It never takes focus on appear, traps focus only inside the settings dialog, and stacks above the sticky purchase bars. Output is `ConsentChoices` (`Record<string, boolean>`); `defaultConsentChoices(categories)` gives the starting state. **UI only, not legal advice:** it reads and writes no cookies or storage and loads no scripts. The host owns consent storage, what each category means and legal compliance. It appears only in its own stories and one demo shop story, never in other screenshots.
- **StickyBuyBar** (commerce): the sticky mobile add-to-cart and checkout bars ([docs/commerce-browsing.md](docs/commerce-browsing.md), [docs/commerce-checkout.md](docs/commerce-checkout.md)).
- **Scroll hints** on AccountNav and CategoryFilter rows: CSS edge fades shown with scroll-state queries.
- **Header `actions`** and `ctx.headerActions`: host controls (search, account, cart) in the site header at every width.
- **Demo shop** in `demo/shop/` ([demo/shop/README.md](demo/shop/README.md)).

### Components

| Group      | Components                                                         |
| ---------- | ------------------------------------------------------------------ |
| Primitives | Button, Text, Heading, Link (+ LinkProvider), Icon, Image, Badge, Divider |
| Layout     | Container, Section, Stack, Grid                                    |
| Navigation | SkipLink, Header, MobileMenu, Footer, Breadcrumbs, Pagination      |
| Forms      | Label, HelpText, FieldError, Field, Input, Textarea, Select, Checkbox, Radio + RadioGroup, Alert, SearchInput, NewsletterSignup, ContactForm (Button gains `loading`) |
| Content & media | PageHeader, Prose, TableOfContents, AuthorByline, TagList, CategoryFilter, ShareLinks, RelatedPosts, Modal, Gallery, Lightbox, VideoEmbed, Video, MapEmbed, Carousel, Tabs, Table, Timeline, Steps, TeamMember + TeamGrid |
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

### Content and media

- **No third-party loading.** Nothing makes a network request on its own. VideoEmbed and MapEmbed
  render a local poster or placeholder, and only create their iframe after the user activates them.
  VideoEmbed uses `youtube-nocookie.com` and Vimeo with `dnt=1`. Share links are plain URLs, with no
  SDKs or scripts.
- **Prose** styles plain HTML elements. `sanitizedHtml` is inserted as-is: the caller must sanitize
  it, because this library does not and has no dependency to do so. Wide `<pre>` and `<table>` elements
  scroll sideways (CSS), and an effect makes the overflowing ones focusable so keyboard users can
  scroll them.
- **TableOfContents** is a sticky list on wide screens (64rem+) and a `<details>` on narrow ones.
  `observe` tracks the heading in view with IntersectionObserver. `buildTocFromHeadings` is a pure
  helper.
- **Modal** and **Lightbox** use `<dialog>.showModal()`. **Carousel** is CSS scroll-snap with
  buttons and dots, and has no autoplay. **Tabs** use a roving tabindex. **Table** wraps the table in a
  focusable, caption-labelled scroll region; `stickyHeader` caps its height so the header can stick.

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

## Using with a CMS

The library ships a CMS-agnostic content model and a renderer; it contains no CMS-specific code.

> **Warning: the library does NOT sanitize HTML.** `RichText` (`{ format: 'html', html }`) is inserted
> into the page as-is. Your adapter or host app must sanitize the HTML (allow-list of tags and
> attributes) **before** producing a `RichText` value. The renderer only neutralizes unsafe URLs
> (`javascript:`, `data:` and similar link and image targets); it does not strip scripts, event
> handlers, inline styles or iframes.

1. **Content model** (`src/content-types`): plain JSON types. A page is
   `PageContent { id, slug, template?, seo, blocks }`, and each block is one of 26 types (`hero`,
   `featureGrid`, `faq`, `richText`, `tabs`, ...). Field-by-field reference:
   [`docs/content-model.md`](docs/content-model.md) (generated from the JSDoc).
2. **Adapter** (your app): maps your CMS's payload to `PageContent`, including converting rich text
   to sanitized HTML. [`src/adapters/example-cms`](src/adapters/example-cms) is a worked example for an
   imaginary CMS, with tests.
3. **Validation**: `validatePage(page)` returns issues (missing fields, unsafe links, missing alt
   text, duplicate ids). Run it in CMS preview or CI.
4. **Rendering**: `<BlockRenderer blocks={page.blocks} />` looks up each block in the registry, maps
   content to props (`toProps`), assigns heading levels and wraps each block in a `Section` with the
   right `Container`.

```tsx
import { BlockRenderer, validatePage, errorsOnly } from 'storybook-playwright';

export function Page({ page }: { page: PageContent }) {
  return (
    <main id="main">
      <BlockRenderer
        blocks={page.blocks}
        context={{ forms: { contact: { onSubmit: sendContact, status } } }}
        onError={(issue) => log.warn(issue)}
        showErrors={isPreview}
      />
    </main>
  );
}
```

Behaviour worth knowing:

- **Headings** are assigned centrally: the first `hero` or `pageHeader` gets the `h1`, every other
  block heading is `h2`, items inside blocks are `h3`. Authors never choose levels.
- **Unknown or broken blocks** render nothing and are reported through `onError` (each block also has
  an error boundary). With `showErrors` they render a visible placeholder instead.
- **Links** other than relative, `http(s):`, `mailto:` and `tel:` are refused: the text renders without
  a link and an `unsafe-href` issue is reported.
- **Forms** are interactive only when `context.forms` provides handlers; otherwise they render as an
  inert preview with a note.

### Custom blocks

`createRegistry` adds block types or replaces built-in ones. A custom block declares its own content
type and maps it to any component's props:

```tsx
import { BlockRenderer, createRegistry, defineBlock, validatePage, type BlockLike } from 'storybook-playwright';

interface QuoteOfTheDayBlock extends BlockLike {
  type: 'quoteOfTheDay';
  quote: string;
  source?: string;
}

const registry = createRegistry([
  defineBlock<QuoteOfTheDayBlock, { text: string; cite?: string }>({
    type: 'quoteOfTheDay',
    label: 'Quote of the day',
    description: 'A short quote with its source.',
    component: QuoteCard,
    toProps: (content, ctx) => {
      if (!content.quote) {
        ctx.report({ code: 'missing-field', message: 'A quote is required.', path: 'quote' });
        return null; // render nothing (or a placeholder with showErrors)
      }
      return { text: content.quote, cite: content.source };
    },
    layout: 'narrow',
  }),
]);

validatePage(page, { knownTypes: registry.types() });
<BlockRenderer blocks={page.blocks} registry={registry} />;
```

A definition with an existing `type` replaces the built-in one; `defaultRegistry` is never mutated.

### Whole pages: templates

`<PageRenderer page={page} chrome={chrome} ctx={{ currentPath }} />` picks a template from
`page.template` and renders the complete page. That includes the skip link, announcement, header,
a single `<main>` and the footer, from the serializable `SiteChrome`.

- Composed templates (`home`, `about`, `pricing`, …) are blocks only.
- Structured templates have typed data of their own: `blog-index`, `blog-post`,
  `case-study-index`, `case-study`, `legal`, `search`, `error`, `thank-you` and `landing`.
- `createTemplates()` adds or replaces templates, in the same pattern as `createRegistry`.
- `getDocumentMeta(page)` returns `<head>` values for the host to render; the library never touches
  `<head>`.

Details, data shapes and the gap report: [`docs/templates.md`](docs/templates.md).

## Commerce foundations

`src/commerce` is the base for the ecommerce phases. There is no shop UI yet, and there is no
backend: the types are the contract for future adapters.

- **Types** (`src/commerce/types`): Product, Variant, StockInfo, PurchaseOption, Cart, CartLine
  (with a display snapshot), Order, CustomerSubscription, ShippingMethod, PromoCode, Review and
  Address. All JSON, with integer minor-unit Money.
- **Pure logic** (`src/commerce/logic`):
  - money arithmetic: BigInt percentages, rounded half away from zero; throws on currency mismatch
  - `percentOff`, `subscriptionUnitPrice`, `formatInterval` and `formatTrial`
  - `computeCartTotals`: promos, shipping, a demo 8% tax estimate, due today, recurring charges and
    flags. It takes `now`; nothing reads the clock.
  - variant selection helpers, plus the `useVariantSelection` hook
  - validators that reuse the core `ValidationIssue` shape
- **Display components:** Price, SaleBadge, StockBadge, ProductTypeBadge and Rating. They are
  controlled and presentational.
- **Rules:** only `src/commerce` and `demo/` may import from `src/commerce`, and nothing under
  `src/` may import `demo/`. `npm run check:boundaries` enforces both.
- **Browsing (Phase 10):**
  - filter, sort and facet logic with a URL query format
  - product cards and grids, the filter panel and drawer, and the product page components
  - `CollectionTemplate` and `ProductDetailTemplate`, merged into the template registry with
    `createTemplates(Object.values(commerceTemplates))`

  See [`docs/commerce-browsing.md`](docs/commerce-browsing.md).
- **Cart and checkout (Phase 11):**
  - cart logic: line notes, stock issues, summary rows; checkout steps per cart kind, step
    validation and `createOrderFromCart`
  - cart components (CartIcon, CartLineItem, CartSummary, PromoCodeInput, MiniCart, ...) and
    checkout components (CheckoutStepper, AddressForm, Shipping/PaymentMethodSelector,
    OrderSummary, DownloadList, ...)
  - `CartTemplate`, `CheckoutTemplate` and `OrderConfirmationTemplate` (`commerceTemplates` keys
    `cart`, `checkout`, `order-confirmation`) and their page validators
  - `Toast` / `ToastRegion` / `useToasts` in core

  **Payment security rule:** the library never renders card number, expiry or CVC inputs.
  `PaymentMethodSelector` has a `paymentFields` slot (`ctx.paymentFields` in the checkout template);
  production hosts must put their payment provider's hosted fields there. `DemoPaymentFields` is a
  static demo panel with no inputs.

  See [`docs/commerce-checkout.md`](docs/commerce-checkout.md).
- **Account area (Phase 12):**
  - auth forms (real POST forms, hidden-field slot for CSRF tokens, non-enumerating errors, password
    checklist) and the account templates (overview, orders, order, downloads, subscriptions,
    subscription, addresses, wishlist)
  - subscription management driven by pure logic (`getSubscriptionActions`, status text from a
    passed-in `now`), invoices, a masked `LicenseKey`, an address book and a wishlist
  - no payment fields: "Update payment method" is a callback with a slot for the provider's fields

  See [`docs/commerce-account.md`](docs/commerce-account.md).

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

### Themes

Stories tagged `theme-smoke` are also captured in every non-default theme (harbor, orchard) at 1280 and
375 px, plus 768 px when the story is also `vrt-full`. Their files are named `<id>-<width>-<theme>.png`;
default-theme names don't change. A story with explicit `vrt.viewports` is captured in themes only at
those widths. Set `parameters.vrt.themes` to change the theme list for one story (`[]` turns it off).
`check:story-tags` checks that the smoke set is tagged. See [docs/theming.md](docs/theming.md).

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

For low-risk variants of a `vrt-full` component (state or colour variants whose 768 layout is already
covered by a sibling story), spread `vrtEdges` from `src/stories/vrt.ts` into the story's parameters:
full-page shots at 375 and 1280 only.

Between viewports the harness does not reload the page: it resizes and asks Storybook to remount the
story in place (`forceRemount`), which re-runs the play function and the a11y check at the new size
and produces the same screenshots as a fresh load, at a fraction of the cost. A probe load at the
wrong viewport (see above) is followed by a fresh load instead.

`parameters: { vrt: { screenshot: false } }` runs a story's play function and a11y check without
capturing it. Use it for states that must never be screenshotted, such as an activated third-party
embed. Those stories intercept the iframe's `src` before the browser can load it
(`src/stories/embedTestUtils.ts`).

**Network guard:** every test fails if the page requests anything other than the local Storybook
server, so stories cannot silently depend on remote images, fonts, scripts or embeds.

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

### Accessibility exceptions

Every story runs axe with the standard rule set. One story disables a rule:

| Story | Rule | Why |
| --- | --- | --- |
| Commerce/Account/OrderHistory · Matrix | `landmark-unique` | Seven order histories on one page repeat the filter and pagination navigation; the account template stories check the rule on a real page. |

### Subsets, shards and speed

The full suite captures every story (about 1,640 screenshots) and takes about 8.5 minutes on the
maintainer's 16-thread machine with 8 workers; the smoke subset about 2.7 minutes, and `test:a11y` about
8.5 minutes (`workers: '50%'` in `playwright.config.ts`).

- **Smoke:** `npm run test:vrt:smoke` runs only stories tagged `theme-smoke` or `vrt-full` (Playwright
  tag `@smoke`), default theme, desktop width, against the same baselines. Use it while iterating.
- **Changed area:** `npm run test:vrt:changed -- "Commerce/Templates/Cart"` runs tests whose title
  matches the pattern (a regular expression; test titles are `<Storybook title> / <story name>`).
- **Shards:** split the run across machines or terminals, each with its own built Storybook:
  `npm run test:vrt -- --shard=1/3`, `--shard=2/3`, `--shard=3/3`. Merge HTML reports with
  `npx playwright merge-reports` if you need one report.
- **Workers:** override with `--workers=N`.

### Debugging flakes

A story is flaky when its screenshot or play function differs between runs of the same code.

1. `npm run build-storybook`, then `npm run test:vrt:flaky -- "<story title>"` runs it five times with
   no retries.
2. Open the failing run's diff in `npm run test:vrt:report`.
3. Fix the cause in the story or component rather than raising tolerances. Usual causes: something
   reads the clock or `Math.random` (pass `now` and ids in), images or fonts finishing late (the harness
   waits for `document.fonts.ready` and every image), focus rings left from a play function (blur or
   assert focus deliberately), scroll position left over, and animations (disabled for screenshots).

### Windows notes

Baselines are generated on a single Windows machine and their names have no platform suffix
(`snapshotPathTemplate` in `playwright.config.ts`). Font rendering differs on other systems, so run the
visual suite on Windows, or regenerate every baseline in one environment (a pinned Playwright Docker
image is the plan for CI; see the roadmap). Files are committed with CRLF line endings by Git; scripts
split lines on `\r?\n`.
