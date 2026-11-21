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
