# docs

The full plan for this pattern library (phases, scope and decisions) lives in the project's planning
doc, not in this repository. This folder is for repo-local notes that support it.

Phase 1: tooling scaffold, three-tier design tokens, Button / Text / Heading,
Foundations stories, and the Playwright visual regression harness with committed baselines.

Phase 2 (branch `phase-2-primitives-layout`): layout tokens and the inverse surface, primitives (Link +
LinkProvider, Icon, Image, Badge, Divider), layout components (Container, Section, Stack, Grid),
local image fixtures, component barrels with `src/index.ts`, and their visual baselines.

Phase 3 (branch `phase-3-navigation`): harness waits for Storybook's `storyFinished` event (play +
a11y gate) and supports `parameters.vrt.viewports`; motion/overlay/z-index/header tokens; social
icons; navigation content types; SkipLink, Header (+ NavDropdown), MobileMenu, Footer, Breadcrumbs,
Pagination; navigation fixtures and a PageShell composition story.

Phase 4 (branch `phase-4-content-sections`): Money type and formatMoney/formatIsoDate utilities;
section content types; Link `unstyled` and ButtonLink; content-section tokens and a default-surface
reset; Hero, FeatureGrid, Card/CardGrid, ArticleCard, MediaText, CtaBanner, Stats,
Testimonial/TestimonialGrid, LogoStrip, Accordion/FaqSection, PricingTable; Brightside fixtures and
SectionBackgrounds composition stories.

Phase 5 (branch `phase-5-forms`): field/warning tokens; validation helpers; Label, HelpText,
FieldError, Field; Input, Textarea, Select, Checkbox, Radio/RadioGroup; Alert; Button `loading`;
SearchInput, NewsletterSignup, ContactForm; form fixtures, kitchen-sink and validation-check stories.

Phase 6 (branch `phase-6-content-media`): content/media tokens and icons; content types; Modal;
PageHeader, Prose, TableOfContents, AuthorByline, TagList/CategoryFilter, ShareLinks, RelatedPosts;
Gallery, Lightbox, VideoEmbed/Video, MapEmbed, Carousel, Tabs; Table, Timeline/Steps,
TeamMember/TeamGrid; article/gallery/team fixtures; blog and about compositions. The VRT harness
now fails on any external network request and supports `vrt.screenshot: false`.

Phase 7 (branch `phase-7-content-model`): JSON-only content model (`src/content-types`: shared refs,
26 block types, `PageContent`, `SiteChrome`, compile-time JSON guard); prop shapes with ReactNode moved
to `src/component-types`; block registry, `BlockRenderer`, central heading levels, validators and link
safety (`src/registry`); example CMS adapter with sanitizing rich-text conversion; JSON page/block
fixtures; generated [`content-model.md`](content-model.md); Vitest unit tests (`npm run test:unit`).

Phase 8 (branch `phase-8-templates`): site layout and page templates (`src/templates`). It adds:

- `SiteLayout` (default, minimal and bare), `chromeToProps` and current-path matching
- the `PageRenderer` and templates registry, `getDocumentMeta`, and heading helpers for TOCs
- a composed `DefaultTemplate` plus nine structured templates, with typed page data
  (`src/content-types/templates.ts`) and template validation
- new components: AnnouncementBar, SiteLogo, LinkList, EmptyState, DescriptionList, PrevNextNav,
  SidebarLayout and StickyActionBar
- template fixtures, stories and a Legal print visual test

See [`templates.md`](templates.md), including the gap report.

Phase 9 (branch `phase-9-commerce-foundations`): commerce foundations in `src/commerce`. It has its
own barrel and is not exported from `src/index.ts`. It adds:

- serializable commerce types
- pure money, cart and pricing math, variant helpers and validators
- Price, SaleBadge, StockBadge, ProductTypeBadge and Rating, plus the `--color-sale` and
  `--color-rating` tokens and star, download and repeat icons
- fixtures for a fictional store (19 products, carts, orders, subscriptions)
- the Storybook-only demo cart in `demo/`
- the `check:boundaries` import check

Phase 10 (branch `phase-10-product-browsing`): product browsing in `src/commerce`. It adds:

- browse logic: filters, a URL format, disjunctive facets, sorting and pagination
- listing, filtering and product page components
- `CollectionTemplate` and `ProductDetailTemplate` (registry entries via `commerceTemplates`), plus
  page validators
- browsing fixtures, including a seeded 48-product catalogue
- stories wired to the demo cart

See [`commerce-browsing.md`](commerce-browsing.md).
