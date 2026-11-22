import { describe, expect, it } from 'vitest';
import { collectTests, summarize } from './ci-summary.mjs';

const test = (title: string, status: string, durations: number[]) => ({
  title,
  file: 'stories.spec.ts',
  tests: [{ status, results: durations.map((duration) => ({ duration })) }],
});
const report = {
  stats: { duration: 600_000 },
  suites: [{ specs: [test('A / Fast', 'expected', [1000])], suites: [{ specs: [test('B / Broken', 'unexpected', [5000, 6000]), test('C / Wobbly', 'flaky', [2000, 3000]), test('D | Pipe', 'skipped', [])] }] }],
};

describe('ci-summary', () => {
  it('flattens nested suites and sums retry durations', () => {
    const rows = collectTests(report);
    expect(rows.map((r) => r.title)).toEqual(['A / Fast', 'B / Broken', 'C / Wobbly', 'D | Pipe']);
    expect(rows[1]).toMatchObject({ duration: 11_000, attempts: 2 });
  });

  it('reports counts, failures, flaky tests, the slowest first and the run link', () => {
    const md = summarize(report, 'https://example.test/run/1');
    expect(md).toContain('❌ 1 failed');
    expect(md).toContain('| 1 | 1 | 1 | 1 | 4 | 10.0 min |');
    expect(md).toContain('### Failed\n\n- B / Broken');
    expect(md).toContain('### Flaky (passed on retry)\n\n- C / Wobbly');
    expect(md.indexOf('| B / Broken | 11.0 s | 2 |')).toBeLessThan(md.indexOf('| C / Wobbly |'));
    expect(md).toContain('| D \\| Pipe | 0.0 s | 0 |');
    expect(md).toContain('[run page](https://example.test/run/1)');
  });

  it('says so when everything passed', () => {
    expect(summarize({ suites: [{ specs: [test('A', 'expected', [1])] }] })).toContain('✅ All visual tests passed');
  });
});
