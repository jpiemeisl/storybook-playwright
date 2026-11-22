# Testing

How the visual and accessibility suites run, why they run in Docker, and how to change the environment.
The everyday commands are in the README ("Visual testing with Docker").

## One rendering environment

Screenshots depend on fonts, font rasterization and anti-aliasing, which differ between operating systems
and even between machines. So every baseline is rendered in one fixed Linux environment: the official
Playwright image pinned in [`docker/image.json`](../docker/image.json) by tag **and** digest, always run as
`linux/amd64` (Apple-silicon Macs emulate it, slower but identical). The same image will run in CI.

- **Fonts:** [`docker/fonts.conf`](../docker/fonts.conf) maps every family in the token stacks to the
  Liberation fonts in the image (sans, serif, mono, all with bold and italic). Without it, fontconfig maps
  `system-ui` to a CJK font with no bold face. Baselines therefore show Liberation Sans (Arial-like), not
  Segoe UI or San Francisco.
- **Node:** the image ships Node 26; `.nvmrc` and `engines` match it.
- **Dependencies:** `node_modules` inside the container is a named Docker volume, installed with `npm ci`
  from the lockfile whenever the lockfile changes. Host-built `node_modules` never enter the container.
- **Storybook:** each Docker script builds Storybook inside the container first, so the static build is
  Linux-built too.

## Host versus container

Running `npm run test:vrt` directly on Windows or macOS still works, but expect failures: text renders in
the host's fonts (Segoe UI on Windows), which changes glyph shapes and often line wrapping. The script
prints a warning on non-Linux hosts. Treat a host run as a quick local signal only; the container result
is the one that counts.

Baselines are **only ever written inside the container**. `npm run test:vrt:update` and any
`--update-snapshots` run refuse to write outside it (they check `PW_DOCKER=1`, which the Docker runner
sets). For a genuine emergency, `PW_ALLOW_HOST_UPDATE=1` overrides the guard; those baselines will not
match the container and must be regenerated there before merging.

## Bumping the Playwright version

Do all of this in one pull request, so the package, the image and the baselines always agree:

1. Update the package: `npm install --save-dev @playwright/test@<version>`.
2. Find the image for that version: `docker buildx imagetools inspect mcr.microsoft.com/playwright:v<version>-noble`
   and copy the top-level `Digest` (the multi-platform index).
3. Update [`docker/image.json`](../docker/image.json): `tag`, `digest`, `playwright` (and `node`, plus
   `.nvmrc` and `engines` in `package.json`, if the image's Node major changed: check with
   `npm run docker:shell` then `node -v`).
4. `npm run check:playwright-image` (it fails until the pin and the package agree).
5. `npm run docker:pull`, then `npm run test:vrt:docker:update -- --update-snapshots=all`. A new browser
   build can shift anti-aliasing slightly; inspect a sample of the changed baselines (templates at every
   width, the theme gallery, the demo shop checkpoints) before committing them.
6. `npm run test:vrt:docker` (twice) and `npm run test:a11y:docker`.
7. Commit the regenerated baselines in their own commit.

Never use a `latest` tag or an unpinned image: two machines would silently render with different browsers.

## Orphans and checks

- `npm run check:snapshots` lists baseline files whose story no longer exists (renamed or deleted
  stories) and fails if there are any; `node scripts/check-orphan-snapshots.mjs --delete` removes them.
  A file for a width a story no longer captures isn't detected (viewports are decided at run time).
- `npm run check:playwright-image` keeps `docker/image.json` in step with the installed Playwright.
- Both run in `npm run check:all`.
