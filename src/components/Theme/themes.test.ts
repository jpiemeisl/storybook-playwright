import { readdirSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Theme } from './Theme';
import { themes } from './themes';

const tokens = new URL('../../tokens/', import.meta.url);

describe('themes list', () => {
  it('every listed theme has a CSS block, and every theme file is listed', () => {
    const files = readdirSync(new URL('themes/', tokens)).filter((f) => f.endsWith('.css')).map((f) => f.replace(/\.css$/, ''));
    const semantic = readFileSync(new URL('semantic.css', tokens), 'utf8');
    for (const { name } of themes) {
      if (name === 'default') expect(semantic).toContain("[data-theme='default']");
      else expect(readFileSync(new URL(`themes/${name}.css`, tokens), 'utf8')).toContain(`[data-theme='${name}']`);
    }
    expect(files.sort()).toEqual(themes.map((t) => t.name).filter((n) => n !== 'default').sort());
    const index = readFileSync(new URL('index.css', tokens), 'utf8');
    for (const file of files) expect(index).toContain(`./themes/${file}.css`);
  });

  it('every theme has a label and a description', () => {
    for (const t of themes) expect(t.label.length * t.description.length).toBeGreaterThan(0);
  });
});

describe('Theme component', () => {
  it('renders exactly one element with data-theme and nothing else', () => {
    expect(renderToStaticMarkup(createElement(Theme, { name: 'harbor' }, 'x'))).toBe('<div data-theme="harbor">x</div>');
    expect(renderToStaticMarkup(createElement(Theme, { name: 'orchard', as: 'section', className: 'c' }))).toBe('<section data-theme="orchard" class="c"></section>');
  });
});
