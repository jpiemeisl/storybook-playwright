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
