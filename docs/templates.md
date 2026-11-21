# Page templates

Phase 8 turns the block model into complete pages. Hand-written (not generated).

- **Code:** [`src/templates`](../src/templates). **Types:** [`src/content-types/templates.ts`](../src/content-types/templates.ts). **Fixtures:** [`src/fixtures/pages`](../src/fixtures/pages) and [`src/fixtures/chrome`](../src/fixtures/chrome).
- **Stories:** `Templates/*` in Storybook. One full-page story per fixture, rendered through `<PageRenderer>`.

## How it fits together

```tsx
import { PageRenderer, getDocumentMeta, validatePage } from 'storybook-playwright';

export function Page({ page, chrome, path }: { page: TemplatePage; chrome: SiteChrome; path: string }) {
  // <head> is the host's job: getDocumentMeta(page) returns title, description, canonical, robots, openGraph.
  return <PageRenderer page={page} chrome={chrome} ctx={{ currentPath: path, onError: log.warn, showErrors: isPreview }} />;
}
```

- `page.template` picks the template from the `templates` registry. A missing name means `default`.
  An unknown name falls back to `default` and is reported through `ctx.onError`. A page that lacks
  the data its template needs (for example a `blog-post` without `article`) also falls back, and is
  reported too.
- Every template has the signature `(props: { page: P; chrome: SiteChrome; ctx?: RenderContext }) => ReactNode`
  and renders `<SiteLayout>` itself, so it chooses its own chrome variant.
- `RenderContext` carries the following:
  - `registry` (blocks)
  - `onError`
  - `showErrors`
  - `currentPath` (marks the current nav item)
  - `forms` (form handlers, passed on to BlockRenderer)
  - `onSearch` (intercepts the GET search forms)
  - `announcementDismissed` and `onAnnouncementDismiss`
- **Heading levels.** Composed templates get their h1 from the first `hero` or `pageHeader` block.
  Structured templates render the page title as the h1 themselves and pass `h1Provided` to
  BlockRenderer, so every block heading starts at h2.
- **Links.** Template data goes through the same rules as block links:
  - Unsafe targets (`javascript:`, `data:`, …) are refused and reported.
  - Listing items with an unsafe link are left out.
  - All internal links render through `Link`, so a `LinkProvider` (Next.js, React Router) applies.
  - No template imports an adapter, a router or a CMS.
- **Validation.** `validatePage(page)` also checks template data:
  - required fields
  - ISO 8601 dates that are real calendar dates (`invalid-date`)
  - pagination sanity, with `currentPage` a whole number from 1 to `totalPages` (`invalid-pagination`)
  - unsafe links in listings
  - duplicate ids in listings, and across template bodies and page blocks
  - unknown templates (`unknown-template`, a warning)
  - composed pages without a `hero` or `pageHeader` block (a warning)

### Adding or replacing a template

```tsx
import { PageRenderer, createTemplates, defineTemplate, SiteLayout, BlockRenderer } from 'storybook-playwright';

interface PressReleasePage extends PageContent { template: 'press'; release: { title: string; date: string } }

const templates = createTemplates([
  defineTemplate<PressReleasePage>({
    name: 'press',
    label: 'Press release',
    description: 'Dated announcement',
    component: ({ page, chrome, ctx }) => (
      <SiteLayout chrome={chrome} currentPath={ctx?.currentPath}>
        {/* render page.release.title as the h1, then: */}
        <BlockRenderer blocks={page.blocks} h1Provided registry={ctx?.registry} onError={ctx?.onError} />
      </SiteLayout>
    ),
    canRender: (page) => 'release' in page,
  }),
]);

<PageRenderer page={page} chrome={chrome} templates={templates} />;
// validatePage(page, { knownTemplates: Object.keys(templates) }) to validate custom template names.
```

`createTemplates` returns a new record. The built-in `defaultTemplates` record is never modified.

## SiteLayout

`<SiteLayout chrome variant? currentPath?>` renders, in order:

1. the SkipLink (to `#main`)
2. the optional AnnouncementBar
3. the Header
4. a single `<main id="main" tabIndex={-1}>`
5. the Footer

That gives exactly one banner, main and contentinfo landmark.

| Variant | Header | Footer | Used by |
| --- | --- | --- | --- |
| `default` | Logo, navigation, CTA, announcement | Logo, columns, social links, legal line | Everything except landing |
| `minimal` | Logo only (no nav landmark, no menu button) | Legal line only | `landing`; `error` with `layout: "minimal"` (the 500 and 503 fixtures) |
| `bare` | None | None | Embeds and CMS previews |

- **Chrome data.** `chromeToProps(chrome, { currentPath, onIssue })` converts the serializable
  `SiteChrome` into component props:
  - the logo `ImageRef` becomes a decorative image beside the wordmark
  - links follow the `LinkRef` rules, with unsafe ones refused and reported
  - header items are matched in prefix mode and footer links in exact mode
  - `markCurrent` and `matchesPath` are pure and unit tested
- **Announcement.** `SiteChrome.announcement` was vague in Phase 7: its tones were `info`,
  `success` and `warning`, and nothing used it. It now has:
  - `message`
  - an optional `link`
  - `tone`: `accent`, `inverse` or `subtle`
  - `dismissible`

  Dismissal is in memory by default. The host can control it with
  `ctx.announcementDismissed` and `onAnnouncementDismiss`. The library never uses `localStorage`
  or cookies. After dismissal, focus moves to `<main>`.
- **Footer newsletter.** `chrome.footer.newsletter` is rendered only when the host passes
  `ctx.forms.newsletter`. A newsletter form in the footer cannot work without a handler, so it is
  never shown as an inert preview there.
- **Print.** Header, footer and announcement are hidden in print for every template.

## Templates

The screenshots are the committed desktop baselines in `tests/visual/__screenshots__/`.

### Composed: `default`, `home`, `about`, `services`, `service-detail`, `pricing`, `contact`

- **Purpose:** pages that are just a list of blocks. `DefaultTemplate` is registered under all seven
  names; the page fixtures make the difference. There are no near-identical wrapper components.
- **Data:** `ComposedPage` is `PageContent` with an optional `template`.
- **Blocks:** all 26.
- **Chrome:** `default`.
- **Screenshots:** `templates-composed-pages--home-1280.png`, `--about-1280.png`, `--services-1280.png`, `--service-detail-1280.png`, `--pricing-1280.png`, `--contact-1280.png`.
- **CMS notes:** the template name is metadata for editors and analytics; all seven render the same
  way. Start every page with a `hero` or `pageHeader` (the validator warns otherwise).

### `blog-index`: BlogIndex

- **Purpose:** the blog listing. It has:
  - a page header
  - category links (`CategoryFilter` in links mode, with `aria-current`)
  - an optional featured post (`ArticleCard` with `size="lg"`, horizontal)
  - a three-column grid of posts
  - pagination (page 1 is `basePath`, then `basePath/page/n`)
  - an empty state with a link back to all posts
- **Data:** `BlogIndexPage`, made of `heading` and `listing: { items: ArticleSummary[]; featured?; categories; activeCategoryId?; allPostsHref?; pagination }`.
- **Blocks:** any, rendered below the listing (for example a newsletter sign-up).
- **Chrome:** `default`.
- **Screenshots:** `templates-blog-index--blog-index-1280.png`, `--empty-1280.png`, `--one-post-1280.png`.
- **CMS notes:** the CMS (or host) does the querying and paging; the template only presents a page
  of results. Include an "All posts" category so the active state is always visible.

### `blog-post`: BlogPost

- **Purpose:** an article, in this order:
  1. breadcrumbs, title (h1), excerpt, byline with date and reading time, tags
  2. hero image
  3. the body beside a sticky table of contents from 64rem; below that width, the TOC is
     collapsible and sits above the body
  4. share links, an author bio, related posts
  5. the page's blocks (for example a CTA)
- **Data:** `BlogPostPage`, with `article: { title; excerpt?; author (name required, bio?); publishedAt; readingTime?; tags?; heroImage?; breadcrumbs?; shareUrl?; body: Block[]; related? }`.
- **Blocks:**
  - `article.body` takes any blocks, laid out in flow (no section bands); its `richText` blocks
    form the prose
  - `page.blocks` render after the article as normal sections
- **TOC:** built from the h2 and h3 headings of the body's rich text.
  - `addHeadingIds` gives headings unique slug ids across the whole page, avoiding `main` and
    block anchor ids.
  - `extractHeadings` builds the list.
  - Fewer than 3 headings means no TOC.
- **Chrome:** `default`.
- **Screenshots:** `templates-blog-post--blog-post-1280.png`, `--short-1280.png`, `--minimal-1280.png`, `--long-titles-1280.png`.
- **CMS notes:**
  - Model the body as rich text, with optional embedded blocks between paragraphs.
  - Headings in rich text should be h2 and h3; do not use h1 in the body.
  - Share links appear only with an absolute `shareUrl` (or `seo.canonicalUrl`).

### `case-study-index`: CaseStudyIndex

- **Purpose:** the case study listing. It has a page header, optional filter links (industry or
  service), a grid of cards, pagination and an empty state. Each card shows the image, client,
  title, summary and key result.
- **Data:** `CaseStudyIndexPage`, made of `heading` and `listing: { items: CaseStudySummary[]; filters?; filterLabel?; activeFilterId?; allHref?; pagination }`.
- **Blocks:** below the listing.
- **Chrome:** `default`.
- **Screenshot:** `templates-case-study-index--case-study-index-1280.png`.

### `case-study`: CaseStudy

- **Purpose:** a single case study, in this order:
  1. page header (h1) with client, industry and services as a description list
  2. hero image
  3. results as stats on a subtle band
  4. the body blocks as page sections
  5. previous/next links
  6. the page's blocks (CTA)
- **Data:** `CaseStudyPage`, with `caseStudy: { title; summary?; client; industry?; services?; breadcrumbs?; heroImage?; results?; body: Block[]; previous?; next? }`.
- **Blocks:** `caseStudy.body` (typically richText, gallery and testimonial) and `page.blocks`.
- **Chrome:** `default`.
- **Screenshots:** `templates-case-study--case-study-1280.png`, `--minimal-1280.png`.

### `legal`: Legal

- **Purpose:** a privacy policy or terms. It has a page header with the "Last updated" date, and
  the text beside a sticky TOC (the same helpers as the blog). It also has a print stylesheet:
  - the chrome and TOC are hidden
  - link URLs are printed after the link text
  - headings stay with the text that follows
- **Data:** `LegalPage`, with `legal: { title; intro?; lastUpdated; breadcrumbs?; body: RichText }`.
- **Chrome:** `default`.
- **Screenshots:** `templates-legal--legal-1280.png`, plus the print emulation in `templates-legal--legal-print.png`.
- **Print check:** `tests/visual/print.spec.ts` emulates print media. It asserts that the page
  header and footer, the announcement and the TOC are hidden, and that `::after` on a `mailto:`
  link contains the URL. It then captures the full page. I looked at the capture: no chrome, the
  body is single-column, link targets are in parentheses after the text, and no heading is
  stranded at the bottom of a page.

### `search`: SearchResults

- **Purpose:** search results, presentational only (results come in as data):
  - the h1 "Search"
  - a real GET form (`action`, `name="q"`) that works without JavaScript; `ctx.onSearch`
    intercepts it if the host wants client-side search
  - the result count in a polite live region (`role="status"`)
  - results as cards, each with a title link, a breadcrumb path, the URL, an excerpt and a type
    badge
  - pagination that keeps the query
- **States:**
  - no query ("Enter a search term")
  - no results (suggested searches and a contact link)
  - one result
  - a full page of 10
  - long titles and URLs that wrap
- **Data:** `SearchPage`, with `search: { query; total; results: SearchResult[]; pagination; action?; suggestions?; contactLink? }`.
- **Chrome:** `default`.
- **Screenshots:** `templates-search-results--results-1280.png`, `--no-query-1280.png`, `--no-results-1280.png`, `--one-result-1280.png`, `--long-titles-1280.png`.
- **CMS notes:** the trail is shown as plain text ("Home › Services"), not as `Breadcrumbs`: ten
  breadcrumb landmarks with the same name would fail `landmark-unique`.

### `error`: ErrorPage

- **Purpose:** 404, 500 and 503 pages, driven by data:
  - the code as a text badge ("Error 404: page not found")
  - the title (the only h1) and a message
  - a primary action and an optional secondary one
  - an optional search form and suggested links
- **Illustration:** none, so meaning is never carried by an image.
- **Data:** `ErrorPageContent`, with `error: { code; title; message; primaryAction; secondaryAction?; links?; searchAction?; layout? }`.
- **Chrome:** `default`, or `minimal` with `layout: "minimal"` (the 500 and 503 fixtures).
- **Screenshots:** `templates-error-page--not-found-1280.png`, `--server-error-1280.png`, `--unavailable-1280.png`.

### `thank-you`: ThankYou

- **Purpose:** a confirmation page with a title (h1), a message, "What happens next" (`Steps`),
  actions and related links.
- **Data:** `ThankYouPage`, with `thankYou: { title; message; steps?; actions?; links? }`.
- **Chrome:** `default`.
- **Screenshot:** `templates-thank-you--thank-you-1280.png`.

### `landing`: Landing

- **Purpose:** blocks only, with minimal chrome (no navigation, no footer navigation) and an
  optional sticky CTA (`stickyCta`, `stickyCtaMessage`).
- **Sticky CTA:**
  - Pure CSS `position: sticky`, shown only below 48rem.
  - While it shows, the document gets `scroll-padding-bottom` equal to the bar's height (the
    `--sticky-action-bar-height` token), so focused or anchored content is never hidden behind it.
  - It is the last element of `<main>`, so at the end of the page it sits after the content
    instead of over it.
- **Data:** `LandingPage`.
- **Chrome:** `minimal`.
- **Screenshots:** `templates-landing--landing-1280.png`; `--with-sticky-cta-375.png` shows the bar.

## Gap report

The success gate was that templates are built only from library components, tokens and layout
primitives. Everything the templates needed that did not exist was added to the library, as listed
below. Only one template has CSS of its own (Legal, print rules); the rest have no `.module.css`
at all, because they did not need one.

### New components

| Component | Why the templates needed it |
| --- | --- |
| `AnnouncementBar` | Site-wide message in SiteLayout (requested). |
| `SiteLogo` | Chrome needs a logo built from data (wordmark plus optional mark). Phase 7 had only a story-only `Logo`. |
| `LinkList` | The footer legal line, error suggestions, thank-you links and search suggestions were all hand-rolled `ul`s with inline list resets. |
| `EmptyState` | Empty blog category, case study filter, search with no query or no results. |
| `DescriptionList` | Case study facts (client, industry, services). Stats is a `dl` too, but its look (large values) is wrong for plain facts. |
| `PrevNextNav` | "Previous / next case study". Pagination is numbered and cannot express it. |
| `SidebarLayout` | Body plus a sticky aside, used by BlogPost and Legal. Its 64rem breakpoint matches TableOfContents. It hides the aside in print. |
| `StickyActionBar` | Landing sticky CTA, with the scroll-padding rule. |

### New token

- `--sticky-action-bar-height`: the bar's minimum height, and the `scroll-padding-bottom` reserved
  while it shows.

### Extensions to existing components

- **Header:**
  - With `items=[]` it renders a logo-only header: no empty nav landmark, no menu button and no
    MobileMenu. Any CTA is always visible at the end. Used by SiteLayout `minimal`.
- **SearchInput:**
  - `action` makes it a real GET form; the input's `name` (`q`) submits natively.
  - `onSearch` is now optional, and still intercepts the submit when given.
- **Card / ArticleCard:**
  - `size="lg"` (larger title, more padding) for the featured post. Previously there was no
    "large" variant.
- **BlockRenderer:**
  - `h1Provided` starts block headings at h2.
  - `layout="flow"` stacks blocks without Section or Container, for an article column.
  - `PageSection` is exported: the same Section and padding-collapse rule the renderer uses, so
    structured template parts and blocks share one vertical rhythm with no doubled padding.
- **validatePage:**
  - template rules, with new issue codes `unknown-template`, `invalid-date` and
    `invalid-pagination`
  - template bodies included in duplicate-id checks

### Library bugs the templates exposed (fixed)

- **PageHeader:** its grid tracks were `auto`, so a long unbreakable tag or title widened the
  column past the viewport (544px at 375px). Both grids now use `minmax(0, 1fr)`.
- **TableOfContents:** long unbroken words in links overflowed. Links now use
  `overflow-wrap: anywhere`.
- **BlockRenderer nested/flow grid:** the same `auto`-track overflow, fixed with
  `minmax(0, 1fr)`.
- **Padding collapse:**
  - A section with `padding: none` (the background hero, spacer) cancelled the next section's top
    padding, so the logo strip after a background hero sat against it.
  - This was already visible in the Phase 7 landing fixture.
  - Such sections no longer take part in the collapse.
- **Global `scroll-padding-top`:** it equalled `--header-height`, so anchored or focused content
  touched the sticky header's 1px border. It now adds `--gap-sm`.

### Template-specific CSS (beyond layout composition)

- **`Legal.module.css`:** print rules only.
  - It prints link targets after link text (`a[href]:not([href^="#"])::after`).
  - It sets `break-after: avoid` on headings and orphans/widows on paragraphs.
  - Reason: this is document-specific print behaviour. Printing URLs after every link would be
    noisy on most pages, so it is not a Prose default. If more print-friendly templates appear,
    this could become a `Prose` prop (`printLinkUrls`).
- **`SiteLayout.module.css`:**
  - a `display: contents` wrapper around header and footer, so they can be hidden in print without
    breaking the sticky header
  - `outline: none` on `<main>` when it takes focus from the skip link
  - the print rule that hides the chrome

  It is layout plumbing, not visual styling.

### Composition decisions to review

- **Search result trail** is text, not `Breadcrumbs` (landmark uniqueness, as noted above).
- **Search results** reuse `Card` in a one-column `CardGrid`, with the URL and trail in the card
  footer. A dedicated `SearchResult` component would allow tighter spacing; deferred.
- **Error code** is a `Badge` with a text label rather than a big decorative number.
- **Related posts and stats at 768px.** Three items wrap 2 + 1 at tablet width. This is existing
  `CardGrid` and `Stats` behaviour: the container is just under the 45rem step. I left it
  unchanged so as not to shift every existing baseline.
- **Templates without a `.module.css`.** The brief listed one per template; I did not add empty
  files.
