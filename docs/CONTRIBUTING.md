# Contributing

How to add to the library without breaking its rules. Run `npm run check:all` before every commit, and
the visual and accessibility suites before every pull request (see the
[checklist](#pull-request-checklist)). The layers and dependency rules are in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Add a component

1. **Folder:** `src/components/<Name>/` (core) or `src/commerce/components/<Name>/` (commerce) with
   `<Name>.tsx`, `<Name>.module.css`, `<Name>.stories.tsx` and `index.ts`. Export it from `src/index.ts`
   or `src/commerce/index.ts`. Core components never import commerce or demo code.
2. **Presentational only:** props in, callbacks out. No fetching, storage, cookies, timers, clock reads
   or `Math.random`. Pass dates in (`now`) and ids from props or `useId`.
3. **Tokens only:** CSS reads semantic tokens (`--color-*`, `--radius-control`, ...). No primitives, raw
   colors or named colors (`check:tokens`). If a theme needs something you can't express, add a semantic
   token and define it in every theme (`check:themes`). Never reference a theme by name.
4. **Layers:** wrap rules in `@layer components`. Respect `prefers-reduced-motion` for any transition.
5. **Stories per state:** one story per meaningful state (default, long content, empty, error, disabled,
   loading, each variant). Choose what gets captured with tags or the `vrt` parameter, as described in
   [testing.md](testing.md#story-tags-and-the-vrt-parameter). Docs-only stories carry `skip-vrt`;
   behavior-only stories use `parameters.vrt.screenshot: false`.
6. **Accessibility:** play functions assert roles, names, states and focus with `storybook/test`
   (`getByRole`, `toHaveAccessibleName`, `toHaveFocus`). The a11y addon runs axe on every story in the
   visual suite and fails on violations. Disabling a rule needs a reason in the story.
7. **Forced colors:** check the component with forced colors emulated. Selected, current and checked
   states must not rely on color alone; use system colors (`Highlight`, `CanvasText`) in
   `@media (forced-colors: active)`.
8. **Fixtures:** story data goes in `src/fixtures` (core) or `src/commerce/fixtures`. Images are local
   SVGs; no remote URLs (the visual suite fails on any network request).
9. **Docs:** a JSDoc summary on the component and its exported types (what it is, behavior,
   accessibility), and comments on non-obvious props; `npm run check:jsdoc` fails without them. Run
   `npm run docs:components` to refresh [COMPONENTS.md](COMPONENTS.md), and add anything non-obvious to
   [component-behavior.md](component-behavior.md).

## Add a block type

1. Add the content type in `src/content-types/blocks.ts` (JSON only: strings, numbers, refs), following
   the JSDoc format described at the top of that file.
2. Register it in `src/registry/` with its component, validation and default props.
3. Add a fixture in `src/fixtures/blocks/` and a story that renders it through `BlockRenderer`.
4. Validation must refuse unsafe links and report missing fields as issues, not throw.
5. Regenerate the content model reference: `npm run docs:content-model`.

## Add a template

1. `src/templates/<Name>/` with the template component and a `canRender(page)` guard for the data it
   needs. Render inside `SiteLayout` and pass `layoutProps(ctx)`.
2. Add its page type to `src/content-types/templates.ts` and register it in `defaultTemplates`
   (`src/templates/registry.ts`). Host apps can add or replace templates with `createTemplates()`.
3. Add page fixtures (including edge cases) and `vrt-full` stories.

## Add a theme

Follow [theming.md](theming.md#writing-a-theme): copy a theme file, define every color token, register it
in `src/tokens/index.css` and `src/components/Theme/themes.ts`, and run `check:themes`, `test:unit`
(contrast) and `test:a11y:docker`.

## Add a CMS adapter

1. Map the CMS's entries to `PageContent` and its rich text to sanitized HTML. No fetching inside the
   adapter: it receives data. [`src/adapters/example-cms`](../src/adapters/example-cms/README.md) is the
   reference; real adapters belong in separate packages that depend on the core types
   ([ROADMAP.md](ROADMAP.md)).
2. Unit tests cover every block mapping, unsafe URLs and unknown types.
3. Pages from the adapter must pass `validatePage` with no errors.

## Add a commerce component

Everything under "Add a component", plus:

- Prices are `Money` (minor units plus currency) formatted with `formatMoney`. Never compute totals in a
  component: use the pure logic in `src/commerce/logic` (unit-tested).
- Callbacks go through `CommerceContext` in templates. Demo wiring belongs in `demo/`, never in `src/`.
- Cover physical, digital and subscription products where they behave differently.

## Pull request checklist

- [ ] `npm run check:all` passes
- [ ] `npm run test:vrt:docker` passes with zero diffs; new or changed baselines were inspected,
      committed together with the change that caused them, and explained in the pull request
      ([testing.md](testing.md#updating-baselines))
- [ ] `npm run test:a11y:docker` passes
- [ ] New stories carry the right tags; behavior stories have play assertions
- [ ] No new runtime dependency; any new devDependency is justified
- [ ] Docs updated: JSDoc, COMPONENTS.md, the relevant docs/*.md (`npm run check:docs` passes), a line
      under "Unreleased" in CHANGELOG.md for any change to the package, and docs/GAPS.md for open items
- [ ] If docs/api-surface.md changed, the CHANGELOG line says how ([versioning.md](versioning.md))

CI runs all of this on the pull request; the one required check is `ci-status` ([ci.md](ci.md)).
