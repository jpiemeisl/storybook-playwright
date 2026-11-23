import { describe, expect, it } from 'vitest';
import { classifyConst, classifyFunction, customProperties, layerNames, lineDiff, moduleExports, renderReport, statements } from './api-report.mjs';

/** An in-memory set of declaration files. */
const files: Record<string, string> = {
  'types/index.d.ts': [
    "export * from './components/Button';",
    "export type * from './content-types';",
    "export { blockTypes } from './content-types';",
    "export type { Gap } from './gap';",
    "export * from './templates';",
  ].join('\n'),
  'types/components/Button/index.d.ts': "export { Button, type ButtonProps } from './Button';\nexport { ButtonLink } from './ButtonLink';",
  'types/components/Button/Button.d.ts': [
    "import type { ButtonHTMLAttributes } from 'react';",
    'export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {',
    '    /** Visual emphasis. */',
    "    variant?: 'primary' | 'secondary';",
    '}',
    '/** A button. */',
    'export declare function Button({ variant, ...rest }: ButtonProps): import("react").JSX.Element;',
  ].join('\n'),
  'types/components/Button/ButtonLink.d.ts': 'export declare const ButtonLink: import("react").ForwardRefExoticComponent<{ href: string }>;',
  'types/content-types/index.d.ts': ['export type BlockType = string;', "export declare const blockTypes: readonly ['hero', 'cta'];", 'export declare const MAX_BLOCKS = 40;'].join('\n'),
  'types/gap.d.ts': "export type Gap = 'sm' | 'md';",
  'types/templates/index.d.ts': [
    "import { HomeTemplate } from './Home';",
    'declare function createTemplates(list: unknown[]): Record<string, unknown>;',
    'export declare const formatPrice: (cents: number) => string;',
    'export declare class TemplateError extends Error {',
    '    constructor(message: string);',
    '}',
    'export { HomeTemplate, createTemplates };',
    'export {};',
  ].join('\n'),
  'types/templates/Home.d.ts': 'export declare function HomeTemplate(props: {\n    page: unknown;\n}): import("react").JSX.Element | null;',
};
const readFile = (path: string) => files[path] ?? null;

describe('api-report', () => {
  it('splits declaration files into top-level statements', () => {
    expect(statements(files['types/components/Button/Button.d.ts']!).map((s) => s.split('\n')[0])).toEqual([
      "import type { ButtonHTMLAttributes } from 'react';",
      'export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {',
      'export declare function Button({ variant, ...rest }: ButtonProps): import("react").JSX.Element;',
    ]);
  });

  it('classifies functions and constants', () => {
    expect(classifyFunction('Button', 'export declare function Button(p: P): import("react").JSX.Element;')).toBe('component');
    expect(classifyFunction('createTemplates', 'export declare function createTemplates(): Templates;')).toBe('function');
    expect(classifyFunction('Checker', 'export declare function Checker(): string;')).toBe('function');
    expect(classifyConst('Card', 'export declare const Card: import("react").NamedExoticComponent<P>;')).toBe('component');
    expect(classifyConst('formatPrice', 'export declare const formatPrice: (cents: number) => string;')).toBe('function');
    expect(classifyConst('MAX', 'export declare const MAX = 40;')).toBe('constant');
    expect(classifyConst('themes', "export declare const themes: readonly [{ readonly name: 'default' }];")).toBe('constant');
  });

  it('follows export chains, including local re-exports and type-only re-exports', () => {
    const exports = moduleExports('types/index.d.ts', readFile);
    expect(exports.get('HomeTemplate')).toMatchObject({ origin: 'types/templates/Home.d.ts', name: 'HomeTemplate' });
    expect(exports.get('createTemplates')).toMatchObject({ origin: 'types/templates/index.d.ts', name: 'createTemplates' });
    expect(Object.fromEntries([...exports].map(([n, { kind, typeOnly }]) => [n, { kind, typeOnly }]))).toEqual({
      Button: { kind: 'component', typeOnly: false },
      ButtonProps: { kind: 'type', typeOnly: true },
      ButtonLink: { kind: 'component', typeOnly: false },
      BlockType: { kind: 'type', typeOnly: true },
      blockTypes: { kind: 'constant', typeOnly: false },
      MAX_BLOCKS: { kind: 'constant', typeOnly: true },
      Gap: { kind: 'type', typeOnly: true },
      formatPrice: { kind: 'function', typeOnly: false },
      TemplateError: { kind: 'class', typeOnly: false },
      HomeTemplate: { kind: 'component', typeOnly: false },
      createTemplates: { kind: 'function', typeOnly: false },
    });
  });

  it('fails loudly on an unresolvable export', () => {
    expect(() => moduleExports('a.d.ts', (p) => (p === 'a.d.ts' ? "export * from './missing';" : null))).toThrow(/cannot resolve '.\/missing'/);
    expect(() => moduleExports('a.d.ts', (p) => (p === 'a.d.ts' ? 'export { Nope };' : null))).toThrow(/neither declares nor imports/);
  });

  it('reads CSS custom properties and layer names', () => {
    expect(customProperties(':root {\n  /* --not-this: 1 */\n  --color-bg: #fff;\n  --space-1: 4px;\n}\n[data-surface] { --color-bg: #000; }')).toEqual(['--color-bg', '--space-1']);
    expect(layerNames("@layer reset, tokens, base;\n@import url('./reset.css') layer(reset);")).toEqual(['reset', 'tokens', 'base']);
  });

  it('renders a sorted report with kinds, entry points and CSS', () => {
    const report = renderReport({
      packageName: '@scope/lib',
      entries: [{ name: 'Core', specifier: '@scope/lib', exports: moduleExports('types/index.d.ts', readFile) }],
      subpaths: ['.', './commerce', './tokens.css'],
      css: { layers: ['reset', 'tokens'], themes: ['default', 'harbor'], semantic: ['--color-bg'] },
    });
    expect(report).toContain('- `@scope/lib/commerce`');
    expect(report).toContain('11 exports: 3 components, 2 functions, 1 class, 2 constants, 3 types.');
    expect(report).toContain('| `MAX_BLOCKS` | constant (type-only export) |');
    const rows = report.split('\n').filter((l) => l.startsWith('| `')).map((l) => l.split('`')[1]);
    expect(rows).toEqual(['BlockType', 'blockTypes', 'Button', 'ButtonLink', 'ButtonProps', 'createTemplates', 'formatPrice', 'Gap', 'HomeTemplate', 'MAX_BLOCKS', 'TemplateError']);
    expect(report).toContain('Themes (`data-theme` values): `default`, `harbor`.');
    expect(report.endsWith('- `--color-bg`\n')).toBe(true);
  });

  it('summarises line differences', () => {
    expect(lineDiff('a\nb\nc', 'a\nc\nd')).toEqual(['- b', '+ d']);
  });
});
