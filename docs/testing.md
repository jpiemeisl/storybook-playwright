# Testing

How the visual and accessibility suites work, how to run them in Docker, and how to review and update
baselines. This is the one place that explains baseline updates; other docs link here. Unit tests
(`npm run test:unit`, Vitest) cover pure logic and run in `npm run check:all`.

## The suites

| Suite | Command | What it checks |
| --- | --- | --- |
| Visual | `npm run test:vrt:docker` | Every story: renders, play function, axe, then screenshots compared with the committed baselines |
| Visual smoke | `npm run test:vrt:docker:smoke` | Stories tagged `theme-smoke` or `vrt-full`, default theme, one desktop capture each |
| Accessibility | `npm run test:a11y:docker` | axe on every story (default theme, desktop), every `theme-smoke` story in every theme, and the demo shop checkpoints in every theme at 1280 and 375 px |

All three run in the pinned Linux container. CI runs the visual suite (four shards) and the
accessibility suite on every pull request ([ci.md](ci.md)).

## One rendering environment

Screenshots depend on fonts, font rasterization and anti-aliasing, which differ between operating
systems and machines. So every baseline is rendered in one fixed Linux environment: the official
Playwright image pinned in [`docker/image.json`](../docker/image.json) by tag **and** digest, always run as
`linux/amd64` (Apple-silicon Macs emulate it, slower but identical). CI uses the same image.

- **Fonts:** [`docker/fonts.conf`](../docker/fonts.conf) maps every family in the token stacks to the
  Liberation fonts in the image (sans, serif and mono, each with bold and italic). Without it,
  fontconfig maps `system-ui` to a CJK font with no bold face. Baselines therefore show Liberation Sans
  (Arial-like), not Segoe UI or San Francisco.
- **Node:** the major version in `.nvmrc` and `engines` matches the image's Node (`node` in
  `docker/image.json`).
- **Dependencies:** `node_modules` inside the container is a named Docker volume, installed with
  `npm ci` whenever `package-lock.json` changes. Host-built `node_modules` never enter the container.
- **Storybook:** each Docker script builds Storybook inside the container first, into a second named
  volume, so the static build is Linux-built and kept apart from any host build in `storybook-static/`.

## Running in Docker

**Prerequisites:** Docker Desktop with the WSL 2 backend on Windows (Linux containers mode), Docker
Desktop on macOS, or Docker Engine on Linux. Rancher Desktop or Podman (with the `docker` CLI shim) work
too.

**First run:**

```sh
npm run docker:pull          # the image pinned in docker/image.json (about 1 GB, once)
npm run test:vrt:docker      # the first run also installs node_modules into a Docker volume
```

**Daily commands** (extra arguments after `--` pass through to Playwright):

| Command | What it does |
| --- | --- |
| `npm run test:vrt:docker` | Build Storybook and run the visual suite in the container |
| `npm run test:vrt:docker -- --shard=1/3` | One shard (or `-- -g "<story title prefix>"` for a subset) |
| `npm run test:vrt:docker:smoke` | The smoke subset in the container |
| `npm run test:vrt:docker:update` | Rewrite failing or missing baselines (see [Updating baselines](#updating-baselines)) |
| `npm run test:a11y:docker` | The accessibility suite in the container |
| `npm run docker:shell` | An interactive shell in the container (the repository is at `/work`) |

**Host runs.** `npm run test:vrt` runs the same suite on the host. On Windows and macOS it prints a
warning and failures are expected: text renders in the host's fonts, which changes glyph shapes and
often line wrapping. Treat a host run as a quick signal; the container result is the one that counts.

**Performance:** the repository is bind-mounted into the container. On Windows, a clone inside the WSL
file system (for example `\\wsl$\Ubuntu\home\<you>\storybook-playwright`, used from a WSL shell) makes
the bind mount much faster than a clone on a Windows drive.

**Troubleshooting:**

- **Dependencies look wrong or stale:** remove the `node_modules` volume and the next run reinstalls it.
  `docker volume ls` lists it as `storybook-playwright-node-modules-<hash>`; remove it with
  `docker volume rm <name>`.
- **The image pull fails:** check proxies, disk space and that the tag and digest in `docker/image.json`
  exist (`docker buildx imagetools inspect mcr.microsoft.com/playwright:<tag>`). No login is needed for
  `mcr.microsoft.com`.
- **"Cannot connect to the Docker daemon" or "pipe not found":** start Docker Desktop and switch to
  Linux containers (`docker context use desktop-linux`).
- **Files owned by root on Linux:** the runner passes your uid:gid. Fix files from older runs with
  `sudo chown -R $(id -u):$(id -g) tests/visual/__screenshots__ test-results storybook-static`.
- **Timeouts:** a slow bind mount (see Performance) or a busy machine; try `-- --workers=4`.

## How the visual suite works

`tests/visual/stories.spec.ts` reads `storybook-static/index.json` and generates one test per story
(test titles are `<Storybook title> / <story name>`). For each capture it opens the story's iframe and
waits for Storybook's `storyFinished` event, which fires only after the story has rendered, its `play`
function has completed and the a11y addon has run axe. Then it waits for web fonts and images (lazy
images are switched to eager so full-page shots include them) and takes the screenshot with animations
disabled and the caret hidden. There are no fixed sleeps.

A story **fails**, before any screenshot comparison, when:

- its `play` function throws, including a failed `expect(...)` interaction assertion;
- axe reports a violation at any of its capture widths (`parameters.a11y.test` is `'error'` in
  `.storybook/preview.tsx`);
- the page requests anything other than the local Storybook server (**network guard**), so stories can't
  silently depend on remote images, fonts, scripts or embeds.

Between widths the harness doesn't reload: it resizes and asks Storybook to remount the story in place
(`forceRemount`), which re-runs the play function and the a11y check at the new size.

Screenshots may differ from the baseline by at most 1% of pixels (`maxDiffPixelRatio: 0.01` in
`playwright.config.ts`). In CI a failing test is retried once.

## Story tags and the `vrt` parameter

Tags choose what is captured. Write them literally on each story or meta: Storybook reads tags
statically, so they can't be spread in from a shared object.

| Tag | Effect |
| --- | --- |
| _(none)_ | One 1280×800 viewport screenshot |
| `vrt-mobile` | Adds a 375×800 screenshot (layout-sensitive stories) |
| `vrt-full` | Full-page screenshots at 375, 768 and 1280 wide |
| `theme-smoke` | Also captured in every non-default theme (see below) |
| `skip-vrt` | Not captured (docs-only stories such as `Playground`); the accessibility suite still runs axe on it |

`npm run check:story-tags` fails when a main story is missing the tags it is expected to carry.

The `vrt` parameter overrides the tags for one story. Parameters, unlike tags, may be spread in:

- `parameters.vrt.viewports` **replaces** the tag-derived captures. A number means
  `{ width, height: 800, fullPage: false }`:

  ```tsx
  export const MobileMenuOpen: Story = {
    parameters: { vrt: { viewports: [375] } },
    play: async ({ canvasElement }) => { /* open the menu */ },
  };

  export const DropdownOpen: Story = {
    parameters: { vrt: { viewports: [{ width: 1280, height: 800, fullPage: true }] } },
  };
  ```

  Parameters aren't in `index.json`, so the harness loads the story once to read them, then reloads
  it at each requested width so play functions and media queries run at that size.
- `parameters: { ...vrtEdges }` (from `src/stories/vrt.ts`): full-page shots at 375 and 1280 only, for
  low-risk variants of a `vrt-full` component whose 768 layout a sibling story already covers.
- `parameters.vrt.screenshot: false` runs the play function and the a11y check without capturing. Use it
  for behavior tests and for states that must never be captured, such as an activated third-party embed
  (those stories intercept the iframe's `src` before the browser can load it; see
  `src/stories/embedTestUtils.ts`).
- `parameters.vrt.themes` changes the theme list for one story (`[]` turns theme captures off).

Play functions in `vrt-full` stories run at 375, 768 and 1280. Write them so they work at every width
(query elements that are visible at all sizes, or use `{ hidden: true }` when only asserting attributes),
or pin the story's widths with `parameters.vrt.viewports`.

**Themes.** Stories tagged `theme-smoke` are also captured in every non-default theme (the `themes` list
in `src/components/Theme/themes.ts`, currently `harbor` and `orchard`) at 1280 and 375 px, plus 768 px
when the story is also `vrt-full`. A story with explicit `vrt.viewports` is captured in themes only at
those widths. See [theming.md](theming.md#storybook-and-tests).

**Baseline files** live in `tests/visual/__screenshots__/`, named `<story-id>-<width>.png`, plus
`-<theme>` for theme captures. They have no platform suffix, because all of them are rendered in the
container.

## Accessibility suite

`npm run test:a11y:docker` (config: `playwright.a11y.config.ts`, specs in `tests/a11y/`) reuses the axe
that the a11y addon ships:

- `all-stories.spec.ts`: one axe pass over every story, including `skip-vrt` ones, in the default theme
  at desktop width;
- `themes.spec.ts`: every `theme-smoke` story in every theme at desktop, and the demo shop checkpoint
  stories in every theme at 1280 and 375 px.

Every story runs axe with the standard rule set. Disabling a rule needs a reason in the story. One story
does:

| Story | Rule | Why |
| --- | --- | --- |
| Commerce/Account/OrderHistory · Matrix | `landmark-unique` | Seven order histories on one page repeat the filter and pagination navigation; the account template stories check the rule on a real page. |

## Reviewing a failure

1. `npm run test:vrt:docker`
2. `npm run test:vrt:report` and open the failing test. The report shows expected, actual and a diff
   (use the slider or the "Diff" view). For a CI failure, download the `playwright-report` artifact
   instead ([ci.md](ci.md#reading-a-failure)).
3. If the change is a bug, fix it and re-run. If it is intended, update the baselines.

## Updating baselines

Baselines are **only ever written inside the container**:

- `npm run test:vrt:docker:update` is the only way to write them.
- The host script `test:vrt:update` and any Playwright run with `--update-snapshots` or `-u` refuse to write on
  the host: they require `PW_DOCKER=1`, which the Docker runner sets (`scripts/vrt-guard.mjs`).
- In CI (`CI` set) baseline writes are always refused, even inside the container and even with the
  override below. CI only compares.
- For a genuine emergency outside CI, `PW_ALLOW_HOST_UPDATE=1` overrides the host guard. Those
  baselines won't match the container and must be regenerated there before merging.

```sh
npm run test:vrt:docker:update
git diff --stat tests/visual/__screenshots__
```

Review the changed PNGs (your Git client or GitHub's image diff) and commit them together with the code
change that caused them, so each baseline update is reviewable alongside its cause. A pull request's
`checks` job lists the baseline files it changes in the job summary.

`--update-snapshots` alone rewrites only baselines that currently fail, so changes inside the 1%
tolerance (a slightly darker gray, say) are left stale. After a token change, rewrite everything:

```sh
npm run test:vrt:docker:update -- --update-snapshots=all
```

## Targeted runs

Run the smallest set that covers the change. Every Docker run builds Storybook in the container first
(several minutes on a Windows or macOS bind mount), then runs the tests.

| When | Run | Covers |
| --- | --- | --- |
| While developing a story or component | `npm run test:vrt:docker -- --grep "<title>"` | Tests whose title matches. Titles are `<Storybook title> / <story name>`, for example `"Media/Modal / Large"`; the pattern is a regular expression matched anywhere in the title, so `"Button"` also matches "Navigation/Pagination / Button Mode" |
| Before opening a pull request | `npm run test:vrt:docker:smoke` | The smoke set: one desktop capture of each `theme-smoke` or `vrt-full` story |
| Token, theme or shared-layout changes | `npm run test:vrt:docker` | The full suite. Locally it can take up to an hour; run it only when a change reaches most stories |
| Everything else | CI | The full suite in four shards on every pull request ([ci.md](ci.md)) |

A small change can hide inside the 1% tolerance: a story only fails when enough of its pixels change.
So a component change is best checked in the stories that use the component, not only in its own
stories, and CI's full run is the one that counts.

[The visual regression demo](../demo/vrt-regression/README.md) shows a targeted run end to end: a
one-line Button regression, the failing screenshot, the report, and the fix.

## Subsets, shards and speed

The full suite captures every story (about 1,630 screenshots); in CI the four shards take about 3
minutes each. Locally:

- **Smoke:** `npm run test:vrt:docker:smoke` (or `npm run test:vrt:smoke` on the host) runs only stories
  tagged `theme-smoke` or `vrt-full` (Playwright tag `@smoke`), default theme, one desktop capture each,
  against the same baselines. Use it while iterating.
- **Changed area:** `npm run test:vrt:changed -- "Commerce/Templates/Cart"` builds Storybook and runs
  tests whose title matches the pattern (a regular expression).
- **Shards:** `npm run test:vrt:docker -- --shard=1/3`, `--shard=2/3`, `--shard=3/3` in separate
  terminals or machines. Merge HTML reports with `npx playwright merge-reports` if you need one report.
- **Workers:** half the CPU threads by default (`workers: '50%'`); override with `--workers=N`.

## Debugging flakes

A story is flaky when its screenshot or play function differs between runs of the same code.

1. `npm run build-storybook`, then `npm run test:vrt:flaky -- "<story title>"` runs the matching tests
   five times each with no retries.
2. Open the failing run's diff with `npm run test:vrt:report`.
3. Fix the cause in the story or component rather than raising tolerances. Usual causes: something reads
   the clock or `Math.random` (pass `now` and ids in), images or fonts finishing late (the harness waits
   for `document.fonts.ready` and every image), focus rings left by a play function (blur, or assert
   focus deliberately), leftover scroll position, and animations (disabled for screenshots).

## Bumping the Playwright version

Do all of this in one pull request, so the package, the image and the baselines always agree:

1. Update the package: `npm install --save-dev @playwright/test@<version>`.
2. Find the image for that version:
   `docker buildx imagetools inspect mcr.microsoft.com/playwright:v<version>-noble` and copy the
   top-level `Digest` (the multi-platform index).
3. Update [`docker/image.json`](../docker/image.json): `tag`, `digest` and `playwright`. If the image's
   Node major changed (check with `npm run docker:shell`, then `node -v`), also update `node` there,
   `.nvmrc`, and `engines` in package.json.
4. `npm run check:playwright-image` (it fails until the pin and the package agree).
5. `npm run docker:pull`, then `npm run test:vrt:docker:update -- --update-snapshots=all`. A new browser
   build can shift anti-aliasing slightly; inspect a sample of the changed baselines (templates at every
   width, the theme gallery, the demo shop checkpoints) before committing them.
6. `npm run test:vrt:docker` (twice) and `npm run test:a11y:docker`.
7. Commit the regenerated baselines in their own commit.

Never use a `latest` tag or an unpinned image: two machines would silently render with different
browsers. Dependabot skips Playwright for this reason ([ci.md](ci.md#dependabot)).

## Orphans and other checks

- `npm run check:snapshots` lists baseline files whose story no longer exists (renamed or deleted
  stories) and fails if there are any; `node scripts/check-orphan-snapshots.mjs --delete` removes them.
  A file for a width a story no longer captures isn't detected (widths are decided at run time).
- `npm run check:playwright-image` keeps `docker/image.json` in step with the installed Playwright.
- Both run in `npm run check:all`.

## Line endings

`.gitattributes` stores and checks out text files with LF on every OS (`* text=auto eol=lf`) and marks
images and archives as binary, so the container and every host see identical files.
