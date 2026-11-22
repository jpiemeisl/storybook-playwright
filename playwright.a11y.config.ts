import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** Accessibility across themes (npm run test:a11y): same server and browser as the visual suite. */
export default defineConfig({ ...base, testDir: 'tests/a11y', reporter: [['list']] });
