# Documentation

Every guide for `@jpiemeisl/pattern-library`, grouped by who it's for. The project overview and the
contributor quickstart are in the [README](../README.md). Changes per release are in
[CHANGELOG.md](../CHANGELOG.md).

## Using the library

For developers of host apps and for the people who model content in a CMS.

| Guide | What it covers |
| --- | --- |
| [consuming.md](consuming.md) | Installing from GitHub Packages, access tokens, `.npmrc`, entry points, CSS imports, LinkProvider wiring, themes, templates, commerce, security rules, Dependabot. Ships inside the package |
| [theming.md](theming.md) | Token tiers, the semantic token contract, applying and writing themes |
| [cms-integration.md](cms-integration.md) | From CMS content to a rendered page: adapters, validation, BlockRenderer, custom blocks |
| [content-model.md](content-model.md) | Field-by-field reference for pages and every block type, with modeling guidance (generated) |
| [templates.md](templates.md) | PageRenderer, SiteLayout and every page template with its data |
| [component-behavior.md](component-behavior.md) | Accessibility patterns, responsive rules and form behavior that props don't show |
| [COMPONENTS.md](COMPONENTS.md) | Every component and its stories (generated) |
| [api-surface.md](api-surface.md) | Every public export, theme, layer and semantic token (generated) |
| [commerce.md](commerce.md) | The commerce entry point: what's in it, wiring and rules |
| [commerce-browsing.md](commerce-browsing.md) | Collection listing, filters in the URL, the product page |
| [commerce-checkout.md](commerce-checkout.md) | Cart, checkout steps per cart kind, the payment slot, confirmation |
| [commerce-account.md](commerce-account.md) | Sign-in forms, account pages, orders, downloads, subscriptions |

## Contributing

For people changing the library.

| Guide | What it covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, project layout, dependency rules and their checks, content and checkout flows |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Adding components, blocks, templates, themes and adapters; the pull request checklist |
| [testing.md](testing.md) | The visual and accessibility suites, Docker, story tags, updating baselines, flakes |
| [ci.md](ci.md) | CI jobs, reading a failure, re-runs, Dependabot, branch protection |

## Maintaining

For the people who release and plan the library.

| Guide | What it covers |
| --- | --- |
| [publishing.md](publishing.md) | The release flow, dry runs, failed releases, deprecation, package settings, the tag ruleset |
| [versioning.md](versioning.md) | What counts as public API, semver rules before and after 1.0.0, deprecations |
| [ROADMAP.md](ROADMAP.md) | Open work, with notes for whoever picks it up |
| [GAPS.md](GAPS.md) | Every gap the phases found, resolved or open |
| [maintaining-docs.md](maintaining-docs.md) | Style rules, which doc owns which topic, `check:docs`, checked examples, generated docs |

Folder READMEs: [demo shop](../demo/shop/README.md), [demo commerce providers](../demo/commerce/README.md)
and the [example CMS adapter](../src/adapters/example-cms/README.md).
