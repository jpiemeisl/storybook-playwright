import { defineConfig, devices } from '@playwright/test';
import { assertCanUpdate } from './scripts/vrt-guard.mjs';

// Baselines are written only inside the Playwright container (scripts/vrt-guard.mjs explains the override).
if (process.argv.some((arg) => arg === '-u' || arg.startsWith('--update-snapshots'))) assertCanUpdate();

const PORT = 6007;

export default defineConfig({
  testDir: 'tests/visual',
  // Baselines are committed. No platform suffix: this project is maintained on a single Windows machine.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  // Half the logical cores: 8 on the 16-thread maintainer machine. Measured in Phase 14: the smoke suite
  // took 2.7 minutes with 8 workers and with 12, so more workers only add load. Override with --workers.
  workers: '50%',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: `npx http-server storybook-static -p ${PORT} -s`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
