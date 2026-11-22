#!/usr/bin/env node
/*
 * Writes the visual-report job summary for GitHub Actions from a merged Playwright JSON report:
 * pass/fail counts, failed and flaky tests, the slowest stories and how to open the HTML report.
 *
 *   node scripts/ci-summary.mjs <report.json> [run url]   (appends to $GITHUB_STEP_SUMMARY, or prints)
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Flattens a Playwright JSON report into one row per test. */
export function collectTests(report) {
  const rows = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const duration = (test.results ?? []).reduce((sum, result) => sum + (result.duration ?? 0), 0);
        rows.push({ title: spec.title, file: spec.file, status: test.status, duration, attempts: (test.results ?? []).length });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);
  return rows;
}

const minutes = (ms) => `${(ms / 60_000).toFixed(1)} min`;
const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const escape = (text) => text.replaceAll('|', '\\|');

/** Builds the Markdown summary. `status` per test: expected | unexpected | flaky | skipped. */
export function summarize(report, runUrl = '') {
  const tests = collectTests(report);
  const count = (status) => tests.filter((t) => t.status === status).length;
  const failed = tests.filter((t) => t.status === 'unexpected');
  const flaky = tests.filter((t) => t.status === 'flaky');
  const slowest = [...tests].sort((a, b) => b.duration - a.duration).slice(0, 10);
  const verdict = failed.length ? `❌ ${failed.length} failed` : '✅ All visual tests passed';
  const lines = [
    `## Visual regression: ${verdict}`,
    '',
    '| Passed | Failed | Flaky | Skipped | Total | Wall time |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    `| ${count('expected')} | ${count('unexpected')} | ${count('flaky')} | ${count('skipped')} | ${tests.length} | ${report.stats?.duration ? minutes(report.stats.duration) : 'n/a'} |`,
    '',
  ];
  if (failed.length) {
    lines.push('### Failed', '', ...failed.slice(0, 50).map((t) => `- ${escape(t.title)}`), ...(failed.length > 50 ? [`- … and ${failed.length - 50} more`] : []), '');
  }
  if (flaky.length) {
    lines.push('### Flaky (passed on retry)', '', ...flaky.map((t) => `- ${escape(t.title)}`), '');
  }
  lines.push(
    '### Slowest 10 stories',
    '',
    '| Story | Time | Attempts |',
    '| --- | ---: | ---: |',
    ...slowest.map((t) => `| ${escape(t.title)} | ${seconds(t.duration)} | ${t.attempts} |`),
    '',
    '### Open the report',
    '',
    `1. Download the \`playwright-report\` artifact${runUrl ? ` from the [run page](${runUrl}) (Artifacts section at the bottom)` : ' from the run page (Artifacts section)'}.`,
    '   Failing shards also upload `test-results-shard-N` with the actual, expected and diff images.',
    '2. Unzip it, then run `npx playwright show-report <unzipped folder>` in the repository.',
    '3. To accept an intended change, update the baselines locally in Docker (`npm run test:vrt:docker:update`) and commit them with the code. CI never writes baselines. See docs/ci.md.',
    '',
  );
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [file, runUrl = ''] = process.argv.slice(2);
  let markdown;
  if (!file || !existsSync(file)) {
    markdown = `## Visual regression: ⚠️ no report\n\nNo merged report was found (${file ?? 'no file given'}). The visual shards probably did not run; check the \`visual\` jobs.\n`;
  } else {
    markdown = summarize(JSON.parse(readFileSync(file, 'utf8')), runUrl);
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  else console.log(markdown);
}
