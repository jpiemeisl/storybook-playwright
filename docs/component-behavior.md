# Component behavior

What components do that isn't obvious from their props: accessibility patterns, responsive rules and
the rules about network, storage and forms. The list of every component and its stories is
[COMPONENTS.md](COMPONENTS.md) (generated); props are documented in Storybook's autodocs and in each
component's JSDoc.

## Rules that apply everywhere

- **Presentational.** Props in, callbacks out. Components don't fetch, store, set cookies or read the
  clock; dates come in as `now`. The only timers are short UI ones: Toast's opt-in auto-dismiss, the
  Textarea counter's one-second announcement delay and ShareLinks resetting its "copied" status.
- **No third-party loading.** Nothing makes a network request on its own. VideoEmbed and MapEmbed render
  a local poster or placeholder and create their iframe only after the user activates them. VideoEmbed
  uses `youtube-nocookie.com`, and Vimeo with `dnt=1`. Share links are plain URLs with no SDKs or
  scripts.
- **Motion.** All transitions sit inside `@media (prefers-reduced-motion: no-preference)`.
- **Forced colors.** Selected, current and checked states don't rely on color alone, and use system
  colors under `@media (forced-colors: active)`.
- **Out of scope:** real authentication, payments, tax, address lookup, data fetching, analytics and
  consent storage belong to the host app. The library gives them UI, types and callbacks.

## Links and navigation

- **LinkProvider** injects the element `Link` uses for internal links (for example Next.js `Link`);
  wiring examples are in [consuming.md](consuming.md#links-wire-linkprovider-to-your-router). Absolute
  and protocol-relative URLs count as external by default (`external={false}` overrides it) and render a
  plain `<a>` with `rel="noopener noreferrer"`.
- **ButtonLink** is a Link (through LinkProvider) styled as a Button. Use it for navigation and Button
  for actions. `Link` has an `unstyled` option so `className` fully controls the look.
- Navigation components take plain data from `src/content-types/navigation.ts` (`NavItem`,
  `SocialLink`, `BreadcrumbItem`); map CMS or router data into those shapes.
- **Header** shows the inline nav from 48rem. It also measures the nav: whenever the items don't fit
  their slot (long or many labels), it hides the inline nav and shows the menu button instead, at any
  width, including when items arrive after the first render. Items never wrap or get clipped. Dropdowns are disclosure buttons (Enter, Space, arrow keys,
  Escape, outside click); nothing depends on hover. The `actions` slot (`ctx.headerActions` in
  templates) holds host controls such as search, account and cart at every width.
- **MobileMenu** is a native `<dialog>` opened with `showModal()`: focus stays in the dialog (Tab can
  reach the browser chrome, which is the platform behavior) and the page behind is inert. Page scroll is
  locked while it's open, and focus returns to the opener on close.
- **Breadcrumbs** and **Pagination** use container queries: below 40rem the trail collapses its middle
  items (still announced) and pagination switches to "Page X of Y" with previous and next.

## Layout and surfaces

- **Section** `background="inverse"` sets `data-surface="inverse"`, which remaps the semantic color
  tokens so any nested component stays readable. `data-surface="default"` resets them for a light panel
  inside an inverse area (the accent CtaBanner uses it). See [theming.md](theming.md).
- **Grid** responds to the width of its own slot through container queries, not the viewport. A numeric
  `columns` value steps down 4 → 3 → 2 → 1 as the slot narrows; pass an object for exact control.
- Items that contain long unbroken strings need a shrinkable track inside them too (for example
  `grid-template-columns: minmax(0, 1fr)` on a card); Stack and Grid already let their children shrink.
- **Content sections** (Hero, FeatureGrid, CardGrid, CtaBanner and the rest) take the plain shapes in
  `src/component-types/sections.ts`. Most are content blocks: put them inside
  `<Section background="…"><Container>…</Container></Section>` and they follow that background's tokens.
  The exception is `<Hero variant="background">`, which is full-bleed and brings its own Container, so
  place it directly in the page. `BlockRenderer` does all of this for content from a CMS
  ([cms-integration.md](cms-integration.md)).

## Content and media

- **Prose** styles plain HTML elements. `sanitizedHtml` is inserted as-is: the caller must sanitize it,
  because the library doesn't. Wide `<pre>` and `<table>` elements scroll sideways, and the overflowing
  ones are made focusable so keyboard users can scroll them.
- **TableOfContents** is a sticky list on wide screens (64rem and up) and a `<details>` on narrow ones.
  `observe` tracks the heading in view with IntersectionObserver. `buildTocFromHeadings` is a pure helper.
- **Modal** and **Lightbox** use `<dialog>` with `showModal()`. **Carousel** is CSS scroll-snap with
  buttons and dots, and never autoplays; in right-to-left layouts (`dir="rtl"`) its ends, dots and
  buttons follow the inline direction and the arrow icons mirror. **Tabs** use a roving tabindex: with
  `activation="manual"` the arrow keys move focus (and the tab stop) without selecting, Enter or Space
  selects, and leaving the tab list resets the tab stop to the selected tab. **Table** wraps the table in a
  focusable, caption-labeled scroll region; `stickyHeader` caps its height so the header can stick.
- **Gallery** thumbnails (with the lightbox) are buttons named by the image's `alt`; an empty `alt`
  falls back to "Open image n of total", so no button is unnamed.
- **Card** with `href`: the title is the only link, and its hit area is stretched over the card. There
  are no nested links, and the focus ring wraps the whole card.
- **Accordion** uses the WAI-ARIA button pattern, not `<details>`, for arrow, Home and End navigation and
  a consistent height animation.
- **PricingTable** shows its Monthly/Annual toggle (native radios) when any tier has an `annualPrice`.
- **Money** is an integer `amount` in minor units plus an ISO `currency`. `formatMoney` takes the number
  of minor digits from `Intl` (USD 2, JPY 0, KWD 3).

## Forms

Forms are presentational and backend-free: they call `onSubmit(values)` and render the `status`
(`'idle' | 'submitting' | 'success' | 'error'`) they're given. They're built on native controls and
native constraint attributes (`required`, `type`, `minLength`, `pattern`, ...) with no form library.

- **Controls** (Input, Textarea, Select, Checkbox, Radio, and SearchInput's input) work controlled or
  uncontrolled, accept `ref` (React 19's ref as a prop), and spread other native props onto the native element. States are styled
  from attributes (`aria-invalid`, `:disabled`, `[readonly]`), not classes.
- **Field** wires the label's `for` and `id`, `aria-describedby` (hint, then error), `aria-invalid`,
  `required` and `aria-required` onto its child control (or passes them to a render prop).
- **Required** fields show a visual `*` hidden from screen readers, which announce the control's native
  `required` state instead. ContactForm states "Required fields are marked with an asterisk".
- **Validation** (`src/utils/validation.ts`): forms use `noValidate` and validate on submit (then on
  blur), with messages built from each control's `ValidityState`. `minLength` and `maxLength` are checked
  in code too, because browsers report them only for typed values, and text fields are measured
  trimmed, as they're submitted (passwords aren't trimmed). A required text field holding only
  whitespace counts as empty (forms trim text values), so it gets the normal required message. ContactForm shows a focused error
  summary (`role="alert"`) whose links move focus to each field. FieldError isn't a live region.
- **Textarea counter:** the visible "n / max" is `aria-hidden`; the limit is in the description, and a
  polite live region announces the remaining characters once typing pauses for a second.
- **Button `loading`** keeps the label in layout (so the width doesn't change), sets `aria-busy` and
  `aria-disabled`, and swallows clicks. It doesn't use `disabled`, so keyboard focus stays put.
- **Forced colors:** checkbox and radio marks switch to explicit system colors (`Highlight`, `FieldText`),
  and invalid fields get a 2px border.

## Consent

**CookieBanner** is a non-modal, labeled region with "Accept all" and "Reject all" given equal weight,
and "Choose settings" (a Modal listing the host's `ConsentCategory[]`; required categories are always
on). It never takes focus when it appears, traps focus only inside the settings dialog, and stacks above
the sticky purchase bars. Both "Reject all" buttons, in the banner and in the settings dialog, call
`onRejectAll`; "Accept all" calls `onAcceptAll`; "Save choices" calls `onSave` with the ticked
`ConsentChoices` (`Record<string, boolean>`). `defaultConsentChoices(categories)` gives the starting state,
and `allConsentChoices(categories, on)` builds the all-on or all-off value. It's UI only and not legal advice: it reads
and writes no cookies or storage and loads no scripts. The host app owns consent storage, what each
category means and legal compliance.
