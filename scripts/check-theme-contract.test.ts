import { describe, expect, it } from 'vitest';
import { checkTheme, parseRules } from './check-theme-contract.mjs';

const semantic = `
:root, [data-theme='default'], [data-surface='default'] { color-scheme: light; --color-bg: var(--n-0); --color-text: var(--n-9); --radius-control: 4px; }
[data-surface='inverse'] { --color-bg: var(--n-9); --color-text: var(--n-0); color: var(--color-text); }`;
const primitives = ':root { --n-0: #fff; --n-9: #111; }';
const theme = (palette: string, inverse = '--color-bg: #eee; --color-text: #111;') => `@media not print { @scope ([data-theme='night']) to ([data-theme]) {
  :scope, [data-surface='default'] { color-scheme: dark; ${palette} }
  [data-surface='inverse'] { ${inverse} }
} }`;

describe('parseRules', () => {
  it('returns innermost rules with their declarations, through nested at-rules and comments', () => {
    const rules = parseRules(`/* x { } */ @layer a { @media screen { .a { color: red; --x: var(--y) } } } .b{margin:0}`);
    expect(rules.map((r) => [r.selector, [...r.decls]])).toEqual([
      ['.a', [['color', 'red'], ['--x', 'var(--y)']]],
      ['.b', [['margin', '0']]],
    ]);
  });
});

describe('checkTheme', () => {
  it('passes a complete theme; shape tokens may inherit', () => {
    expect(checkTheme('night', theme('--color-bg: #000; --color-text: #fff;'), semantic, primitives)).toEqual([]);
  });

  it('reports a missing colour token, a missing inverse token, an unknown token and an unknown reference', () => {
    expect(checkTheme('night', theme('--color-bg: #000; --color-glow: var(--n-0); --color-text: var(--nope);', '--color-bg: #eee;'), semantic, primitives)).toEqual([
      'night: inverse surface is missing --color-text',
      'night: --color-glow is not a semantic token of the default theme',
      'night: --color-text references unknown --nope',
    ]);
    expect(checkTheme('night', theme('--color-bg: #000;'), semantic, primitives)).toContain('night: palette is missing --color-text');
  });

  it('requires the matching scope and color-scheme', () => {
    expect(checkTheme('day', theme('--color-bg: #000; --color-text: #fff;'), semantic, primitives)).toContain("day: must be scoped to [data-theme='day']");
    expect(checkTheme('night', theme('--color-bg: #000; --color-text: #fff;').replace('color-scheme: dark;', ''), semantic, primitives)).toContain('night: palette must set color-scheme');
  });
});
