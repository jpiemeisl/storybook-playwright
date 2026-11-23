# Changelog

All notable changes to `@jpiemeisl/pattern-library` are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses
[semantic versioning](https://semver.org/). Before 1.0.0, a minor version (0.x.0) may contain breaking
changes and a patch version (0.x.y) never does; see [docs/versioning.md](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/versioning.md) for what
counts as public API.

Add notes under "Unreleased" in the pull request that makes the change, in the sections Added, Changed,
Deprecated, Removed, Fixed and Security. `npm run release:prepare` moves them under the new version.

## [Unreleased]

## [0.1.0] - 2026-11-22

The first published version.

### Added

- Core entry point (`@jpiemeisl/pattern-library`): React 19 components for content sites. It covers
  primitives, layout, navigation, content sections, forms, media, and the site chrome (header, footer,
  announcement bar, skip link, cookie banner).
- Content model: typed blocks and pages, the block registry and `BlockRenderer`, and page templates with
  `PageRenderer`, `createTemplates` and `defineTemplate`. Also `validatePage` and `getDocumentMeta`, and
  link-safety rules for every link that comes from content.
- `LinkProvider`, which routes internal links through the host's router (Next.js, React Router or any
  anchor component).
- Commerce entry point (`@jpiemeisl/pattern-library/commerce`), imported separately from core:
  - Product listing, product detail, cart, checkout and order confirmation templates, and the mini cart.
  - Account and authentication templates.
  - Pure logic for cart totals, checkout steps, filters and validation.
  - Payment input stays in the host's slot: the library renders no card fields.
- Design tokens in three tiers (primitives, semantic, component) with cascade layers (`reset`, `tokens`,
  `base`, `components`, `overrides`).
- The `default`, `harbor` and `orchard` themes, applied with `data-theme` or the `Theme` component.
- CSS entry points: `tokens.css`, `core.css`, `commerce.css` and one file per theme.
- TypeScript declarations for every entry point.

[Unreleased]: https://github.com/jpiemeisl/storybook-playwright/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jpiemeisl/storybook-playwright/releases/tag/v0.1.0
