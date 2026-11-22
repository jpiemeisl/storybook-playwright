import base from './playwright.config';

/*
 * Smoke subset (npm run test:vrt:smoke): stories tagged theme-smoke or vrt-full (Playwright tag @smoke),
 * default theme, desktop width only, compared against the same committed baselines.
 */
export default {
  ...base,
  grep: /@smoke/,
  projects: base.projects!.map((project) => ({ ...project, use: { ...project.use, vrtMode: 'smoke' } })),
};
