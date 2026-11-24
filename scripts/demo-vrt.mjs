#!/usr/bin/env node
/*
 * The visual regression demo (demo/vrt-regression/README.md). Plain Node, no dependencies, no shell
 * strings, so it behaves the same from PowerShell, cmd and bash.
 *
 *   node scripts/demo-vrt.mjs break   apply demo/vrt-regression/break.patch (npm run demo:break)
 *   node scripts/demo-vrt.mjs fix     reverse it                            (npm run demo:fix)
 *   node scripts/demo-vrt.mjs vrt     build Storybook and run the demo story's visual test in Docker
 *                                     (npm run demo:vrt)
 *   node scripts/demo-vrt.mjs images  after a failing demo:vrt: copy the desktop expected, actual and
 *                                     diff PNGs to demo-output/, plus crops around the buttons
 *
 * demo:vrt builds with `storybook build --test`, Storybook's own test build: no docs addon, docs pages,
 * docgen or source maps, and no tree shaking. In the container it takes about 10 s instead of about
 * 5 minutes. It is used for the demo story only. Checked against every desktop baseline, the test build
 * matched 770 of 776 pixel for pixel, including every Button and Modal story; the 6 "Templates/Composed
 * pages" stories differ, so it is no general replacement for the normal build. Baselines are never
 * written here: npm run test:vrt:docker:update, with the normal build, is the only way to write them.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
process.chdir(root);
const PATCH = 'demo/vrt-regression/break.patch';
const FILES = 'src/components/Button/';
/** The demo story's test title (tests/visual/stories.spec.ts names each test "<title> / <name>"). */
const DEMO_TEST = 'Media/Modal / Large';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error) {
    console.error(`Could not run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  return result;
};
const git = (...args) => run('git', args);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
const applied = () => git('apply', '-R', '--check', PATCH).status === 0;

function demoBreak() {
  const dirty = git('status', '--porcelain', '--', FILES).stdout.trim();
  if (applied()) fail(`The regression is already applied. Run npm run demo:fix first.\n${dirty}`);
  if (dirty) fail(`Refusing to apply the regression: the Button files have uncommitted changes.\n${dirty}\nCommit or discard them first.`);
  const check = git('apply', '--check', PATCH);
  if (check.status !== 0) fail(`${PATCH} does not apply to the current Button files:\n${check.stderr}`);
  if (git('apply', PATCH).status !== 0) fail(`git apply ${PATCH} failed.`);
  console.log(`Applied ${PATCH}. Changed lines:\n`);
  console.log(git('diff', '--unified=0', '--color=never', '--', FILES).stdout.split('\n').filter((line) => /^[-+@]/.test(line) && !/^(---|\+\+\+) /.test(line)).join('\n'));
  console.log('\nNext: npm run demo:vrt');
}

function demoFix() {
  if (!applied()) fail('The regression is not applied (git apply -R --check failed), so there is nothing to reverse.');
  if (git('apply', '-R', PATCH).status !== 0) fail(`git apply -R ${PATCH} failed.`);
  const dirty = git('status', '--porcelain', '--', FILES).stdout.trim();
  console.log(`Reversed ${PATCH}.${dirty ? `\nThe Button files still have other changes:\n${dirty}` : ' The Button files match the last commit.'}`);
  console.log('Next: npm run demo:vrt');
}

function demoVrt() {
  const start = performance.now();
  console.log(`Building Storybook (test build) and running "${DEMO_TEST}" in the Playwright container…\n`);
  const status = run('node', ['scripts/docker-run.mjs', 'node', 'scripts/demo-vrt.mjs', 'vrt-container'], { stdio: 'inherit' }).status ?? 1;
  const seconds = ((performance.now() - start) / 1000).toFixed(0);
  console.log(`\ndemo:vrt ${status === 0 ? 'passed' : 'failed'} in ${seconds} s.`);
  console.log('Open the report: npm run test:vrt:report');
  process.exit(status);
}

/** Inside the container: the guard, the test build, then only the demo story's test. */
function demoVrtContainer() {
  if (process.env.PW_DOCKER !== '1') fail('vrt-container runs inside the Playwright container only; use npm run demo:vrt.');
  const step = (label, command, args) => {
    const start = performance.now();
    const status = run(command, args, { stdio: 'inherit' }).status ?? 1;
    console.log(`${label}: ${((performance.now() - start) / 1000).toFixed(0)} s`);
    if (status !== 0) process.exit(status);
  };
  step('Guard', 'node', ['scripts/vrt-guard.mjs', 'check']);
  step('Storybook test build', 'npx', ['storybook', 'build', '--test', '--quiet']);
  step('Visual test', 'npx', ['playwright', 'test', '--grep', DEMO_TEST]);
}

const OUT = 'demo-output';
const SHOTS = ['expected', 'actual', 'diff'].map((kind) => `media-modal--large-1280-${kind}.png`);
/**
 * One clip for all three images, so the crops line up: the dialog's footer buttons ("Cancel",
 * "Pause plan") in both the expected and the actual position (the actual modal sits 4px lower).
 */
const CLIP = { x: 828, y: 576, width: 256, height: 80 };

function demoImages() {
  const dir = existsSync('test-results') ? readdirSync('test-results').find((d) => d.startsWith('stories-Media-Modal-Large')) : undefined;
  const missing = SHOTS.filter((file) => !dir || !existsSync(join('test-results', dir, file)));
  if (missing.length) fail(`Missing in test-results/: ${missing.join(', ')}. Run npm run demo:break, then npm run demo:vrt.`);
  mkdirSync(OUT, { recursive: true });
  for (const file of SHOTS) copyFileSync(join('test-results', dir, file), join(OUT, file));
  const status = run('node', ['scripts/docker-run.mjs', 'node', 'scripts/demo-vrt.mjs', 'images-container'], { stdio: 'inherit' }).status ?? 1;
  if (status !== 0) process.exit(status);
  console.log(`Images in ${OUT}/:\n${SHOTS.flatMap((f) => [f, f.replace('.png', '-crop.png')]).map((f) => `  ${f}`).join('\n')}`);
}

/** Inside the container: crops each PNG by opening it in Chromium and taking a clipped screenshot. */
async function demoImagesContainer() {
  if (process.env.PW_DOCKER !== '1') fail('images-container runs inside the Playwright container only; use node scripts/demo-vrt.mjs images.');
  const { readFileSync } = await import('node:fs');
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  // Device scale 2 and pixelated scaling: sharp, twice-size crops for slides.
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  for (const file of SHOTS) {
    const src = `data:image/png;base64,${readFileSync(join(OUT, file)).toString('base64')}`;
    await page.setContent(`<body style="margin:0"><img src="${src}" style="display:block;image-rendering:pixelated"></body>`);
    await page.locator('img').evaluate((img) => img.decode());
    await page.screenshot({ path: join(OUT, file.replace('.png', '-crop.png')), clip: CLIP });
  }
  await browser.close();
}

const commands = {
  break: demoBreak,
  fix: demoFix,
  vrt: demoVrt,
  images: demoImages,
  'vrt-container': demoVrtContainer,
  'images-container': demoImagesContainer,
};
const command = commands[process.argv[2]];
if (!command) fail('Usage: node scripts/demo-vrt.mjs break | fix | vrt | images');
command();
