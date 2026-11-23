# Page templates

Templates turn a page of content (blocks plus, for structured templates, their own data) into a
complete page inside the site chrome.

- **Code:** [`src/templates`](../src/templates). **Types:** [`src/content-types/templates.ts`](../src/content-types/templates.ts). **Fixtures:** [`src/fixtures/pages`](../src/fixtures/pages) and [`src/fixtures/chrome`](../src/fixtures/chrome).
- **Stories:** `Templates/*` in Storybook, full pages rendered through `PageRenderer`, plus `Templates/SiteLayout`.
- **Baselines:** `tests/visual/__screenshots__/templates-*.png`.

## How it fits together

```tsx check
import { PageRenderer, type SiteChrome, type TemplatePage, type ValidationIssue } from '@jpiemeisl/pattern-library';

export function Page({ page, chrome, path, isPreview, onIssue }: { page: TemplatePage; chrome: SiteChrome; path: string; isPreview: boolean; onIssue: (issue: ValidationIssue) => void }) {
  // <head> is the host app's job: getDocumentMeta(page) returns the title, description, canonical URL, robots and Open Graph values.
  return <PageRenderer page={page} chrome={chrome} ctx={{ currentPath: path, onError: onIssue, showErrors: isPreview }} />;
}
```

- `page.template` picks the template from the templates record (default: `defaultTemplates`). A
  missing name means `default`. An unknown name falls back to `default` and is reported through
  `ctx.onError` (`unknown-template`, a warning). A page that lacks the data its template needs (for
  example a `blog-post` without `article`) also falls back to `default`, reported as `missing-field`.
- Every template has the signature `(props: { page: P; chrome: SiteChrome; ctx?: RenderContext }) => ReactNode`
  and renders `<SiteLayout>` itself, so it chooses its own chrome variant.
- `RenderContext` ([`src/templates/types.ts`](../src/templates/types.ts)) is all optional:
  - `registry`: the block registry (also settable as the `registry` prop of `PageRenderer`)
  - `onError`: called once per problem (unknown templates, missing template data, refused links, block issues)
  - `showErrors`: visible placeholders for blocks that could not render (CMS previews)
  - `currentPath`: marks the matching nav item
  - `forms`: form handlers, passed on to BlockRenderer and the footer newsletter
  - `onSearch`: intercepts the GET search forms
  - `announcementDismissed` and `onAnnouncementDismiss`: controlled announcement dismissal
  - `headerActions`: host controls (search, account, cart) shown in the header
- **Heading levels.** In composed templates the page's h1 comes from the blocks: the first block
  that renders a heading gets h1 if it is a `hero` or `pageHeader`. Structured templates render the
  page title as the h1 themselves and pass `h1Provided` to BlockRenderer, so every block heading
  starts at h2.
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
  - an active category or filter id that is not in the list (a warning)
  - duplicate ids in listings, and duplicate block ids and anchor ids across template bodies and page blocks
  - unknown templates (`unknown-template`, a warning)
  - composed and `landing` pages without a `hero` or `pageHeader` block (a warning; checked only
    when the page names its template)

### Adding or replacing a template

```tsx check
import { BlockRenderer, Container, PageHeader, PageRenderer, PageSection, SiteLayout, createTemplates, defineTemplate, layoutProps, validatePage, type PageContent, type SiteChrome } from '@jpiemeisl/pattern-library';

interface PressReleasePage extends PageContent {
  template: 'press';
  release: { title: string; date: string };
}

const templates = createTemplates([
  defineTemplate<PressReleasePage>({
    name: 'press',
    label: 'Press release',
    description: 'Dated announcement',
    component: ({ page, chrome, ctx }) => (
      <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
        <PageSection>
          <Container size="xl">
            <PageHeader title={page.release.title} description={page.release.date} />
          </Container>
        </PageSection>
        <BlockRenderer blocks={page.blocks} h1Provided registry={ctx?.registry} context={ctx} onError={ctx?.onError} showErrors={ctx?.showErrors} />
      </SiteLayout>
    ),
    canRender: (page) => 'release' in page,
  }),
]);

// Validate custom template names too.
export const check = (page: PageContent) => validatePage(page, { knownTemplates: Object.keys(templates) });

export function Page({ page, chrome }: { page: PageContent; chrome: SiteChrome }) {
  return <PageRenderer page={page} chrome={chrome} templates={templates} />;
}
```

`createTemplates` returns a new record; a definition with an existing name replaces that template.
The built-in `defaultTemplates` record is never modified. The commerce templates are added the same
way: `createTemplates(Object.values(commerceTemplates))` ([commerce.md](commerce.md)).

## SiteLayout

`<SiteLayout chrome variant? currentPath?>` renders, in order:

1. the SkipLink (to `#main`)
2. the optional AnnouncementBar (`default` variant only)
3. the Header
4. a single `<main id="main" tabIndex={-1}>`
5. the Footer

That gives exactly one banner, main and contentinfo landmark (`bare` has only the main landmark).

| Variant | Header | Footer | Used by |
| --- | --- | --- | --- |
| `default` | Logo, navigation, CTA, header actions; announcement above | Logo, columns, social links, newsletter (with a handler), legal line | Every built-in template except `landing` |
| `minimal` | Logo only (no nav landmark, no menu button) | Legal line only | `landing`; `error` with `layout: "minimal"` (the 500 and 503 fixtures); the commerce checkout and sign-in templates |
| `bare` | None | None | Embeds and CMS previews |

- **Chrome data.** `chromeToProps(chrome, { currentPath, onIssue })` converts the serializable
  `SiteChrome` into component props:
  - the logo `ImageRef` becomes a decorative image beside the wordmark
  - links follow the `LinkRef` rules, with unsafe ones refused and reported
  - header items are matched in prefix mode and footer links in exact mode
  - `markCurrent` and `matchesPath` are pure and unit tested
- **Announcement.** `SiteChrome.announcement` has:
  - `message`
  - an optional `link`
  - `tone`: `accent` (default), `inverse` or `subtle`
  - `dismissible`

  Dismissal is in memory by default. The host app can control it with
  `ctx.announcementDismissed` and `onAnnouncementDismiss`. The library never uses `localStorage`
  or cookies. After dismissal, focus moves to `<main>`.
- **Footer newsletter.** `chrome.footer.newsletter` is rendered only when the host app passes
  `ctx.forms.newsletter`. A newsletter form in the footer cannot work without a handler, so it is
  never shown as an inert preview there.
- **Print.** Header, footer and announcement are hidden in print for every template.

## Templates

Story titles are given for each template; their baselines follow the story ids
(`templates-blog-post--short-1280.png` for `Templates/Blog post`, story `Short`).

### Composed: `default`, `home`, `about`, `services`, `service-detail`, `pricing`, `contact`

- **Purpose:** pages that are just a list of blocks. `DefaultTemplate` is registered under all seven
  names; the page content makes the difference.
- **Data:** `ComposedPage` is `PageContent` with an optional `template`.
- **Blocks:** any block type ([content-model.md](content-model.md)).
- **Chrome:** `default`.
- **Stories:** `Templates/Composed pages`.
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
- **Stories:** `Templates/Blog index` (full listing, empty, one post).
- **CMS notes:** the CMS (or host app) does the querying and paging; the template only presents a page
  of results. Include an "All posts" category so the active state is always visible.

### `blog-post`: BlogPost

- **Purpose:** an article, in this order:
  1. breadcrumbs, title (h1), excerpt, byline with date and reading time, tags
  2. hero image
  3. the body beside a sticky table of contents from 64rem; below that width, the TOC is
     collapsible and sits above the body
  4. share links, an author bio
  5. related posts
  6. the page's blocks (for example a CTA)
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
- **Stories:** `Templates/Blog post` (full, short, minimal, long titles, mobile TOC expanded).
- **CMS notes:**
  - Model the body as rich text, with optional embedded blocks between paragraphs.
  - Headings in rich text should be h2 and h3; do not use h1 in the body.
  - Share links appear only when `shareUrl` (or else `seo.canonicalUrl`) is set; use an absolute URL.

### `case-study-index`: CaseStudyIndex

- **Purpose:** the case study listing. It has a page header, optional filter links (industry or
  service), a grid of cards, pagination and an empty state. Each card shows the image, client,
  title, summary and key result.
- **Data:** `CaseStudyIndexPage`, made of `heading` and `listing: { items: CaseStudySummary[]; filters?; filterLabel?; activeFilterId?; allHref?; pagination }`.
- **Blocks:** below the listing.
- **Chrome:** `default`.
- **Stories:** `Templates/Case study index`.

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
- **Stories:** `Templates/Case study` (full, minimal).

### `legal`: Legal

- **Purpose:** a privacy policy or terms. It has a page header with the "Last updated" date, and
  the text beside a sticky TOC (the same helpers as the blog). It also has print rules
  (`Legal.module.css`, the only template stylesheet with visual rules):
  - the chrome and TOC are hidden
  - link URLs are printed after the link text
  - headings stay with the text that follows, and paragraphs keep at least 3 lines together
- **Data:** `LegalPage`, with `legal: { title; intro?; lastUpdated; breadcrumbs?; body: RichText }`.
- **Chrome:** `default`.
- **Stories:** `Templates/Legal`; the print emulation baseline is `templates-legal--legal-print.png`.
- **Print check:** `tests/visual/print.spec.ts` emulates print media. It asserts that the page
  header and footer, the announcement and the TOC are hidden, that `::after` on a `mailto:` link
  contains the URL and that the page makes no external requests. It then captures the full page.

### `search`: SearchResults

- **Purpose:** search results, presentational only (results come in as data):
  - the h1 "Search"
  - a real GET form (`action`, `name="q"`) that works without JavaScript; `ctx.onSearch`
    intercepts it if the host app wants client-side search
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
- **Stories:** `Templates/Search results`.
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
- **Stories:** `Templates/Error page` (not found, server error, unavailable).

### `thank-you`: ThankYou

- **Purpose:** a confirmation page with a title (h1), a message, "What happens next" (`Steps`),
  actions and related links.
- **Data:** `ThankYouPage`, with `thankYou: { title; message; steps?; actions?; links? }`.
- **Chrome:** `default`.
- **Stories:** `Templates/Thank you`.

### `landing`: Landing

- **Purpose:** blocks only, with minimal chrome (no navigation, no footer navigation) and an
  optional sticky CTA (`stickyCta`, `stickyCtaMessage`).
- **Sticky CTA:**
  - Pure CSS `position: sticky`, shown only below 48rem.
  - While it shows, the document gets `scroll-padding-block-end` of the bar's height
    (`--sticky-action-bar-height`) plus `--gap-sm`, so focused or anchored content is never hidden
    behind it.
  - It is the last element of `<main>`, so at the end of the page it sits after the content
    instead of over it.
- **Data:** `LandingPage`.
- **Chrome:** `minimal`.
- **Stories:** `Templates/Landing`; the 375 px baseline of `With sticky CTA` shows the bar.
