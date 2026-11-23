# Maintaining the docs

How the documentation is organized, the style it follows, and the checks that keep it true. Docs describe
the library as it is today; history belongs in [CHANGELOG.md](../CHANGELOG.md) and [GAPS.md](GAPS.md),
open work in [ROADMAP.md](ROADMAP.md).

## Which doc owns which topic

Explain each topic once, in the doc that owns it, and link there from everywhere else.

| Topic | Owner |
| --- | --- |
| Project overview, contributor quickstart, the scripts table | [README.md](../README.md) |
| Installing and using the package in a host app | [consuming.md](consuming.md) (ships in the package) |
| Story tags, the `vrt` parameter, Docker, reviewing failures, **updating baselines** | [testing.md](testing.md) |
| CI jobs, the `ci-status` gate, branch protection, Dependabot | [ci.md](ci.md) |
| Releases, package settings, the tag ruleset | [publishing.md](publishing.md) |
| What counts as public API, semver, deprecations | [versioning.md](versioning.md) |
| Layers, project layout, dependency rules | [ARCHITECTURE.md](ARCHITECTURE.md) |
| How to add components, blocks, templates, themes, adapters; the pull request checklist | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Tokens and themes | [theming.md](theming.md) |
| CMS content to rendered page, custom blocks | [cms-integration.md](cms-integration.md) |
| Block and field reference, modeling guidance | [content-model.md](content-model.md) (generated) |
| Page templates and SiteLayout | [templates.md](templates.md) |
| Component behavior beyond props | [component-behavior.md](component-behavior.md) |
| Commerce | [commerce.md](commerce.md) and the three commerce guides |
| Open work / history of gaps | [ROADMAP.md](ROADMAP.md) / [GAPS.md](GAPS.md) |

Every file in `docs/` must be linked from the [docs index](README.md); `check:docs` fails on orphans.

## Style

- **US English:** color, behavior, gray, catalog, license, canceled, labeled, modeling, organize.
  Identifiers keep the spelling they have in code, in code font.
- **Sentence-case headings:** "Updating baselines", not "Updating Baselines".
- **Consistent terms:**
  - **baseline** for an approved screenshot (not `snapshot`); **capture** for taking one;
  - **story** for a Storybook story;
  - **host app** for an application that uses the library;
  - theme names in code font: `default`, `harbor`, `orchard`;
  - **block** for a content-model block, **template** for a page template.
- **Current state only:** no `we will`, no `Phase N adds`, no `until X exists`. When something changes,
  delete the outdated text rather than adding a caveat.
- **Point at sources of truth** instead of copying values that change: the Node version is in `.nvmrc`,
  the Playwright image in `docker/image.json`, versions in package.json and CHANGELOG.md. Link to
  generated files instead of hand-written counts and lists.
- **Example versions in prose are placeholders** (`0.N.0`, `<version>`), never real numbers: a real one
  becomes "the current version" the day a release reaches it, and `check:docs` flags it.
- **No secrets in examples:** placeholders and environment variables only (`NODE_AUTH_TOKEN`).
- **consuming.md ships in the package:** links from it to anything outside the package use absolute
  `https://github.com/jpiemeisl/storybook-playwright/blob/main/...` URLs, because relative links break in
  `node_modules`.

## The checks

`npm run check:docs` (in `check:all`, so in CI) scans every Markdown file outside dependencies and build
output and fails on:

| Rule | What fails | Fix |
| --- | --- | --- |
| `links` | A relative link to a missing file, or an `#anchor` that matches no heading (GitHub's slug rules: lowercase, punctuation dropped, spaces to hyphens, `-1`, `-2` for duplicates) | Fix the link or the heading |
| `scripts` | `npm run <name>` where package.json has no such script | Fix the name, or list a host app script in `scripts/check-docs.allow.json` |
| `paths` | A repository path in inline code (`src/`, `docs/`, `scripts/`, `tests/`, `.github/`, `docker/`, `demo/`) that doesn't exist. Placeholders (`<name>`), globs and `...` are skipped | Fix the path, or add it to `scripts/check-docs.allow.json` with a reason |
| `examples` | A code block tagged `tsx check` or `ts check` that doesn't typecheck | Fix the example |
| `stale` | A phrase from `scripts/check-docs.stale.json`: things that are no longer true, British spellings, the wrong term | Rewrite the sentence. CHANGELOG.md and GAPS.md are exempt (history) |
| `orphans` | A file in `docs/` that the docs index doesn't link | Link it from [README.md](README.md) |
| `versions` | A hard-coded Node, Playwright, Storybook or package version in prose (outside code blocks) | Point at the source of truth, or add `<!-- check-docs: version-ok -->` to the line when the version is deliberate |

Each entry in `check-docs.stale.json` and `check-docs.allow.json` carries a `reason`; add one when you add
an entry. A stale entry with `"scope": "prose"` ignores inline code, so identifiers don't trip spelling
rules.

`npm run check:docs:external` checks every external link with a HEAD request (falling back to GET) and
prints the ones that fail. It never fails the build and isn't in CI, because remote sites go down and
some refuse automated requests. Run it before a release.

## Checked code examples

Tag a TypeScript example that readers will copy with `check` after the language:

````md
```tsx check
import { Button } from '@jpiemeisl/pattern-library';

export const Example = () => <Button variant="primary">Save</Button>;
```
````

`check:docs` writes each checked block to its own module and typechecks it against the library **source**
(`src/index.ts` and `src/commerce/index.ts`, through tsconfig `paths`), with the repository's compiler
options. So an example breaks the build as soon as a prop or export it uses changes. Write checked
examples as complete modules: import what you use (`import type` for types), and take values the example
doesn't create as typed function parameters. `next/link` and `react-router` are stubbed for the router
examples. Untagged blocks aren't checked: use them for pseudo-code, partial snippets, shell, YAML and CSS.

## JSDoc

Every public export (the names in [api-surface.md](api-surface.md)) needs a JSDoc summary line, and
`npm run check:jsdoc` (in `check:all`) fails without one. Components describe their purpose; props whose
meaning isn't obvious from the name get a comment too, because Storybook's autodocs and editors show
them.

## Generated docs

Never edit these by hand. Change the source, then regenerate:

| File | Source | Regenerate | Checked by |
| --- | --- | --- | --- |
| [COMPONENTS.md](COMPONENTS.md) | Story titles and tags (Storybook index) | `npm run build-storybook`, then `npm run docs:components` | `npm run docs:components -- --check` |
| [content-model.md](content-model.md) | JSDoc in `src/content-types/blocks.ts` and `shared.ts`, examples in `src/fixtures/blocks/`, guidance text in `scripts/content-model-docs.mjs` | `npm run docs:content-model` | a unit test |
| [api-surface.md](api-surface.md) | The built `.d.ts` files, `dist/tokens/` | `npm run build:lib`, then `npm run api:report` | `npm run check:api` |
