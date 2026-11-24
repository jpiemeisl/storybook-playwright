# Visual regression demo

A repeatable demo of the visual suite catching a small CSS regression. It takes about a minute and a half,
plus the time spent in the report.

**The regression** ([break.patch](break.patch)): medium buttons use the small height token,
`--control-height-sm` instead of `--control-height-md`. They're 8px shorter (40px to 32px), which is a
realistic copy-paste slip and easy to miss by eye.

**The story:** `Media/Modal / Large`, a centered dialog with "Cancel" and "Pause plan" buttons in its
footer. The shorter buttons make the dialog 8px shorter, so the whole centered dialog moves 4px. The
diff lights up the entire dialog, not just the buttons. The story has two baselines (1280 and 375 px,
no theme captures); the 1280 capture runs first, so that's the one that fails.

## Prerequisites

- Docker running (Docker Desktop with the WSL 2 backend on Windows; see
  [Running in Docker](../../docs/testing.md#running-in-docker)).
- A clean checkout of `main` (or any branch whose Button files have no uncommitted changes).
- Before presenting, run `npm run demo:vrt` once, so the image is pulled and the container's
  dependencies are installed.

## Runbook

### 1. `npm run demo:break`

Applies [break.patch](break.patch) with `git apply` and prints the changed lines:

```text
Applied demo/vrt-regression/break.patch. Changed lines:

@@ -47 +47 @@
-    min-height: var(--control-height-md);
+    min-height: var(--control-height-sm);

Next: npm run demo:vrt
```

### 2. `npm run demo:vrt`

Builds Storybook and runs only the demo story's visual test in the Playwright container. Expected
(build output trimmed):

```text
Building Storybook (test build) and running "Media/Modal / Large" in the Playwright container…

Guard: 0 s
Storybook test build: 14 s
Running 1 test using 1 worker
  ✘  1 [chromium] › tests/visual/stories.spec.ts:126:3 › Media/Modal / Large (1.8s)
  1) [chromium] › tests/visual/stories.spec.ts:126:3 › Media/Modal / Large › 1280px
    Error: expect(page).toHaveScreenshot(expected) failed
      30008 pixels (ratio 0.03 of all image pixels) are different.
      Snapshot: media-modal--large-1280.png
  ...
  1 failed
Visual test: 6 s

demo:vrt failed in 22 s.
Open the report: npm run test:vrt:report
```

The suite allows up to 1% of pixels to differ; this change moves 3%.

### 3. `npm run test:vrt:report`

Opens the HTML report in the browser (Ctrl+C in the terminal stops it). Click the failed test
**Media/Modal / Large**, then scroll to the image comparison for `media-modal--large-1280.png`:

- **Expected:** the committed baseline in `tests/visual/__screenshots__/`.
- **Actual:** the screenshot this run took.
- **Diff:** pixels that differ are red; the rest is faded. Here the whole dialog is outlined, because
  it moved 4px, and the button edges are solid red, because they changed size.
- **Side by side** and **Slider:** drag the slider across the footer buttons to see the two heights
  swap. This is the best view for the audience.

The trace (`trace.zip`, linked in the report) shows every step the test took.

### 4. `npm run demo:fix`

Reverses the patch with `git apply -R`:

```text
Reversed demo/vrt-regression/break.patch. The Button files match the last commit.
Next: npm run demo:vrt
```

### 5. `npm run demo:vrt`

The same run, now green:

```text
Storybook test build: 21 s
Running 1 test using 1 worker
  ✓  1 [chromium] › tests/visual/stories.spec.ts:126:3 › Media/Modal / Large (1.4s)
  1 passed (3.5s)
Visual test: 4 s

demo:vrt passed in 27 s.
```

## Timings

Measured on the maintainer machine (Windows, Docker Desktop, repository on a Windows drive):

| Run | Time |
| --- | --- |
| `npm run demo:vrt`, broken | 22 s (build 14 s, test 6 s) |
| `npm run demo:vrt`, fixed | 27 s (build 21 s, test 4 s) |
| For comparison, `npm run test:vrt:docker -- --grep "Button"` (normal build, 14 tests) | 7 minutes (the build took 6 min 44 s, the tests 9 s) |

**Why demo:vrt is fast:** it builds with `storybook build --test`, Storybook's own test build (no docs
addon, docs pages, docgen or source maps). In the container that takes 10 to 20 seconds instead of
5 to 7 minutes. Screenshots are still taken in the pinned container and compared against the same
committed baselines. The test build matched 770 of 776 desktop baselines pixel for pixel, including the
demo story, but not all of them, so the regular scripts keep the normal build and baselines are only
ever written by `npm run test:vrt:docker:update`. See `scripts/demo-vrt.mjs`.

## Troubleshooting

- **"Could not run docker" or "Cannot connect to the Docker daemon":** start Docker Desktop, wait until
  it says it's running, and switch to Linux containers if asked. Then run `npm run demo:vrt` again.
- **"The regression is already applied. Run npm run demo:fix first.":** a previous demo was not reset.
  Run `npm run demo:fix`, then start again from step 1.
- **"The regression is not applied … nothing to reverse":** `demo:fix` was run twice, or the file was
  reset by hand. Nothing to do; `git status` should show no Button changes.
- **"Refusing to apply the regression: the Button files have uncommitted changes":** commit, stash or
  discard the changes under `src/components/Button/` first.
- **The broken run passes, or the fixed run fails:** the Storybook build is stale, or the run tested
  something other than the patched code. `demo:vrt` always rebuilds Storybook in the container, so check
  that the patch is (or isn't) applied with `git diff src/components/Button`, then run `npm run demo:vrt`
  again. Don't run Playwright on its own against an old `storybook-static/` build, and never use the
  Storybook dev server for screenshots.
- **The report shows an older run:** the report is replaced by each run. Stop the report server
  (Ctrl+C) and run `npm run test:vrt:report` again after `demo:vrt` finishes.
- **The first run is slow:** the first Docker run pulls the pinned image (about 1 GB) and installs
  dependencies into a Docker volume. Do a run before the presentation.

## Slide images

After a failing run (steps 1 and 2), `node scripts/demo-vrt.mjs images` copies the desktop expected,
actual and diff PNGs into `demo-output/` (ignored by Git) and adds a `-crop` version of each, clipped to
the footer buttons with Chromium in the container. The same clip is used for all three, so they line up.
