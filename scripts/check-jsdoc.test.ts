import { describe, expect, it } from 'vitest';
import { moduleExports } from './api-report.mjs';
import { missingSummaries, summaryFor } from './check-jsdoc.mjs';

const dts = [
  "import type { ReactNode } from 'react';",
  '/** A call to action. Use for actions; use ButtonLink for navigation. */',
  'export declare function Button(props: { children?: ReactNode }): import("react").JSX.Element;',
  '/**',
  ' * Visual emphasis of a button.',
  ' * Second line of the summary.',
  ' *',
  ' * Details after a blank line.',
  ' * @default primary',
  ' */',
  "export type ButtonVariant = 'primary' | 'ghost';",
  '/** @deprecated Tags only. */',
  'export declare const OLD = 1;',
  'export interface Bare {',
  '    /** A field comment is not a summary for the interface. */',
  '    a: string;',
  '}',
  '/** Local helper re-exported below. */',
  'declare function helper(): void;',
  'export { helper as publicHelper };',
].join('\n');

describe('check-jsdoc', () => {
  it('reads the summary line above a declaration', () => {
    expect(summaryFor(dts, 'Button')).toBe('A call to action. Use for actions; use ButtonLink for navigation.');
    expect(summaryFor(dts, 'ButtonVariant')).toBe('Visual emphasis of a button. Second line of the summary.');
    expect(summaryFor(dts, 'OLD')).toBe('');
    expect(summaryFor(dts, 'Bare')).toBeNull();
    expect(summaryFor(dts, 'helper')).toBe('Local helper re-exported below.');
    expect(summaryFor(dts, 'Missing')).toBeNull();
  });

  it('lists public exports without a summary, following renames', () => {
    const files: Record<string, string> = { 'types/index.d.ts': "export * from './button';", 'types/button.d.ts': dts };
    const readFile = (p: string) => files[p] ?? null;
    const missing = missingSummaries([{ entry: 'core', exports: moduleExports('types/index.d.ts', readFile) }], readFile);
    expect(missing.map((m) => m.name)).toEqual(['OLD', 'Bare']);
  });
});
