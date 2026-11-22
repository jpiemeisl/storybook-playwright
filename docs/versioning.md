# Versioning

`@jpiemeisl/pattern-library` follows [semantic versioning](https://semver.org/). This page says what the
version number promises: what counts as public API, which changes need which bump, and how things are
deprecated. The release mechanics are in [publishing.md](publishing.md).

## Public API

A change to any of these is an API change, and the version must say so:

- **Exports** of every entry point: `@jpiemeisl/pattern-library` (core) and
  `@jpiemeisl/pattern-library/commerce`. That covers components, functions, classes, constants and types.
  [api-surface.md](api-surface.md) lists them all and is regenerated from the build, so a pull request
  that changes the API also changes that file (`npm run check:api` fails otherwise).
- **The package's entry points** (the `exports` map in package.json): the JavaScript entries, `core.css`,
  `commerce.css`, `tokens.css` and `themes/<name>.css`.
- **Component props**: names, types, defaults and documented behaviour, including accessibility
  behaviour that consumers rely on (focus handling, landmarks, heading levels).
- **Content types**: the shape of `PageContent`, blocks, templates, `SiteChrome` and the commerce page
  types that adapters produce. Adding a required field is breaking; adding an optional one is not.
- **Semantic token names**: the CSS custom properties of the semantic tier (for example `--color-action`,
  `--text-size-xl`). They're listed in api-surface.md. Their values may change in any release (that's what a
  theme refresh is), but the names may not.
- **Theme names** (`default`, `harbor`, `orchard`) and the **`data-theme` attribute** that applies them.
- **CSS layer names and their order**: `reset, tokens, base, components, overrides`. Consumers put their
  own styles in `overrides` or in unlayered CSS.

## Not public API

These can change in any release, including a patch:

- **Internal class names.** Components use CSS modules, so class names are generated, and consumer CSS
  must not target them. Style through tokens, props, `className` or the `overrides` layer.
- **Primitive tokens** (the palette and scale tier, for example `--teal-600` or `--neutral-200`). Use
  semantic tokens. The `tokens/*` export still lets you import `primitives.css` directly, but the names in
  it carry no promise.
- **The file layout inside `dist/`** beyond the entry points in the `exports` map. Import from the
  package entry points only.
- **Markup details** that aren't documented behaviour, such as wrapper elements.
- **Visual details** within a token's intent, such as spacing tweaks, focus ring rendering or
  anti-aliasing. Visual baselines guard these inside this repository, not as a promise to consumers.
- **Storybook, test tooling, the Playwright image and the release scripts.**

## Version rules

### Before 1.0.0 (now)

The API is still settling, so the rules shift one place to the right:

| Change | Bump | Example |
| --- | --- | --- |
| Breaking change to public API | **minor**: 0.1.0 → 0.2.0 | Renaming a prop, removing an export, renaming a semantic token |
| New feature, backwards compatible | **minor** or patch | A new component, a new optional prop |
| Fix, no API change | **patch**: 0.1.0 → 0.1.1 | A focus bug, a contrast fix within token intent |

Consumers should depend on `~0.1.0` (patches only), not `^0.1.0`, until 1.0.0. In npm, `^0.1.0` also
allows only `0.1.x`, so both are safe, but `~` states the intent. Every minor release's CHANGELOG entry
lists its breaking changes under "Changed" or "Removed", with the migration.

### From 1.0.0

| Change | Bump |
| --- | --- |
| Breaking change to public API | **major** |
| New feature, backwards compatible (new export, new optional prop, new theme, new semantic token) | **minor** |
| Fix with no API change | **patch** |

## Deprecations

Something public is never removed without warning:

1. **Mark it.** Add a JSDoc `@deprecated` tag that names the replacement. Editors then strike it through
   and TypeScript reports it:

   ```ts
   /** @deprecated Use `variant="ghost"` instead. Will be removed in 0.3.0. */
   subtle?: boolean;
   ```

   For a semantic token, keep the old name as an alias of the new one (`--old: var(--new);`) and note it
   in the CHANGELOG.
2. **Announce it** under "Deprecated" in the CHANGELOG entry of the release that deprecates it, with the
   replacement and the planned removal version.
3. **Keep it for at least one minor version.** Something deprecated in 0.2.0 can be removed in 0.3.0 at
   the earliest. After 1.0.0, removal waits for the next major.
4. **Remove it** in a later release, listed under "Removed" in its CHANGELOG entry.
