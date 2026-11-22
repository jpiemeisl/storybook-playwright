import { describe, expect, it } from 'vitest';
import { applyAllowlist, checkCss, forbiddenPrimitives } from './check-tokens.mjs';

const primitives = forbiddenPrimitives(':root { --neutral-0: #fff; --teal-600: #0b625e; --radius-2: 4px; --radius-full: 9999px; --shadow-1: 0 1px 2px rgb(0 0 0 / 0.1); --font-sans: system-ui; --space-4: 1rem; --font-size-md: 1rem; }');
const messages = (css: string) => checkCss(css, primitives).map((v) => v.message);

describe('check-tokens', () => {
  it('collects colour, radius, shadow and font-family primitives but not spacing or type scale', () => {
    expect([...primitives].sort()).toEqual(['--font-sans', '--neutral-0', '--radius-2', '--radius-full', '--shadow-1', '--teal-600']);
  });

  it('flags primitives and raw colours in declarations', () => {
    expect(messages('.a {\n  color: var(--teal-600);\n  border-radius: var(--radius-2);\n  box-shadow: var(--shadow-1);\n  font-family: var(--font-sans);\n}')).toEqual([
      'primitive token --teal-600',
      'primitive token --radius-2',
      'primitive token --shadow-1',
      'primitive token --font-sans',
    ]);
    expect(messages('.a {\r\n  color: #fff;\r\n  background: rgb(0 0 0 / 0.5);\r\n  border-color: hsl(10 20% 30%);\r\n  outline-color: white;\r\n}')).toEqual(['raw colour #fff', 'raw colour rgb()', 'raw colour hsl()', 'named colour white']);
  });

  it('allows semantic tokens, spacing primitives, keywords and forced-colours system colours', () => {
    expect(messages('.a {\n  color: var(--color-text);\n  padding: var(--space-4);\n  background: transparent;\n  fill: currentColor;\n  border-color: inherit;\n}\n@media (forced-colors: active) {\n  .a { color: CanvasText; outline-color: Highlight; border-color: GrayText; }\n}')).toEqual([]);
  });

  it('ignores selectors, comments, strings and urls', () => {
    expect(messages(".red,\n[data-tone='green'] {\n  /* color: red; */\n  content: 'white';\n  background-image: url(white.png);\n}")).toEqual([]);
  });

  it('applies the allowlist by file and matching text', () => {
    const violations = checkCss('.a {\n  fill: #6b7f5a;\n}', primitives);
    expect(applyAllowlist('x.css', violations, [{ file: 'x.css', match: 'fill: #6b7f5a', reason: 'illustration' }])).toEqual([]);
    expect(applyAllowlist('y.css', violations, [{ file: 'x.css', match: 'fill: #6b7f5a', reason: 'illustration' }])).toHaveLength(1);
  });
});
