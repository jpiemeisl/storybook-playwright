# Contributing

How to add to the library without breaking its rules. Run `npm run check:all` before every commit, and
the visual and accessibility suites before every PR (see the release checklist in the README).

## Add a component

1. **Folder:** `src/components/<Name>/` (core) or `src/commerce/components/<Name>/` (commerce) with
   `<Name>.tsx`, `<Name>.module.css`, `<Name>.stories.tsx` and `index.ts`. Export it from
   `src/index.ts` or `src/commerce/index.ts`. Core components never import commerce or demo code.
2. **Presentational only:** props in, callbacks out. No fetching, storage, cookies, timers, clock reads
   or `Math.random`. Pass dates in (`now`) and ids from props or `useId`.
3. **Tokens only:** CSS reads semantic tokens (`--color-*`, `--space-*`, `--radius-control`, ...).
   No primitives, raw colours or named colours (`check:tokens`). If a theme needs something you can't
   express, add a semantic token and define it in every theme (`check:themes`). Never reference a theme
   by name.
4. **Layers:** wrap rules in `@layer components`. Respect `prefers-reduced-motion` for any transition.
5. **Stories per state:** one story per meaningful state (default, long content, empty, error,
   disabled, loading, each variant). Write tags literally on each story (Storybook reads them
   statically): `vrt-mobile` (1280 and 375), `vrt-full` (375, 768, 1280 full page), `skip-vrt`
   (docs only), `theme-smoke` (also captured in every theme), or `parameters.vrt.viewports`.
   Behaviour-only stories use `parameters.vrt.screenshot: false`.
6. **Accessibility:** play functions assert roles, names, states and focus with `storybook/test`
   (`getByRole`, `toHaveAccessibleName`, `toHaveFocus`). The a11y addon runs axe on every story in the
   visual suite and fails on violations. Disabling a rule needs a reason in the story.
7. **Forced colours:** check the component with forced colours emulated. Selected, current and
   checked states must not rely on colour alone; use system colours (`Highlight`, `CanvasText`) in
   `@media (forced-colors: active)`.
8. **Fixtures:** story data goes in `src/fixtures` (core) or `src/commerce/fixtures`. Images are local
   SVGs; no remote URLs.
9. **Docs:** a JSDoc summary on the component (what it is, behaviour, accessibility). Run
   `npm run docs:components` to refresh [COMPONENTS.md](COMPONENTS.md).

## Add a block type

1. Add the content type in `src/content-types/blocks.ts` (JSON-only: strings, numbers, refs).
2. Register it in `src/registry/` with its component, validation and default props.
3. Add a fixture in `src/fixtures/blocks/` and a story that renders it through `BlockRenderer`.
4. Validation must refuse unsafe links and report missing fields as issues, not throw.
5. Regenerate the content model docs: `npm run docs:content-model`.

## Add a template

1. `src/templates/<Name>/` with the template component and a `canRender(page)` guard for the data it
   needs. Render inside `SiteLayout` and pass `layoutProps(ctx)`.
2. Add its page type to `src/content-types/templates.ts` and register it in `defaultTemplates`
   (`src/templates/registry.ts`). Hosts can add or replace templates with `createTemplates()`.
3. Add page fixtures (including edge cases) and `vrt-full` stories.

## Add a theme

Follow [theming.md](theming.md#writing-a-theme): copy a theme file, define every colour token, register
it in `src/tokens/index.css` and `themes.ts`, and run `check:themes`, `test:unit` (contrast) and
`test:a11y`.

## Add a CMS adapter

1. `src/adapters/<cms>/` maps the CMS's entries to `PageContent` and its rich text to sanitized HTML or
   structured nodes. No fetching inside the adapter: it receives data.
2. Unit tests cover every block mapping, unsafe URLs and unknown types.
3. Pages from the adapter must pass `validatePage` with no errors.

## Add a commerce component

Everything under "Add a component", plus:

- Prices are `Money` (minor units plus currency) formatted with `formatMoney`; never compute totals in
  a component: use the pure logic in `src/commerce/logic` (unit tested).
- Callbacks go through `CommerceContext` in templates. Demo wiring belongs in `demo/`, never in `src/`.
- Cover physical, digital and subscription products where they behave differently.

## PR checklist

- [ ] `npm run check:all` passes
- [ ] `npm run test:vrt` passes; new or changed baselines were inspected and are explained in the PR
- [ ] `npm run test:a11y` passes
- [ ] New stories carry the right tags; behaviour stories have play assertions
- [ ] No new runtime dependency; any new devDependency is justified
- [ ] Docs updated (component JSDoc, COMPONENTS.md, the relevant docs/*.md, GAPS.md for open items)
