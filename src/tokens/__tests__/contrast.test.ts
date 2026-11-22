/*
 * WCAG contrast for every theme, on the page and on its inverse surface. Pairs mirror how components
 * use the tokens. Text: 4.5:1. Non-text (borders, icons, focus rings, graphical stars): 3:1.
 * Disabled states are exempt (WCAG 1.4.3) and not checked: --color-disabled-*.
 */
import { describe, expect, it } from 'vitest';
import { themes } from '../../components/Theme/themes';
import { colourOf, contrast, parseColour, resolve, tokenMap, type Surface } from './resolveTokens';

type Pair = [fg: string, bg: string, min: number, why: string];

const TEXT = 4.5;
const UI = 3;

const pairs: Pair[] = [
  ['--color-text', '--color-bg', TEXT, 'body text'],
  ['--color-text', '--color-bg-subtle', TEXT, 'text on subtle sections'],
  ['--color-text', '--color-bg-muted', TEXT, 'text on muted panels'],
  ['--color-text', '--color-surface', TEXT, 'text on cards and dialogs'],
  ['--color-text', '--color-bg-accent-subtle', TEXT, 'text on accent panels'],
  ['--color-text-muted', '--color-bg', TEXT, 'muted text'],
  ['--color-text-muted', '--color-bg-subtle', TEXT, 'muted text on subtle'],
  ['--color-text-muted', '--color-surface', TEXT, 'muted text on cards'],
  ['--color-text-subtle', '--color-bg', TEXT, 'subtle text'],
  ['--color-action-text', '--color-action', TEXT, 'primary button label'],
  ['--color-action-text', '--color-action-hover', TEXT, 'primary button hover'],
  ['--color-action-text', '--color-action-active', TEXT, 'primary button pressed'],
  ['--color-action', '--color-bg', TEXT, 'action text (secondary buttons, links styled as action)'],
  ['--color-action', '--color-surface', TEXT, 'action text on cards'],
  ['--color-action', '--color-action-subtle', TEXT, 'action text on accent badges'],
  ['--color-link', '--color-bg', TEXT, 'link text'],
  ['--color-link', '--color-bg-subtle', TEXT, 'link text on subtle'],
  ['--color-link-hover', '--color-bg', TEXT, 'link hover'],
  ['--color-focus-ring', '--color-bg', UI, 'focus ring'],
  ['--color-focus-ring', '--color-surface', UI, 'focus ring on cards'],
  ['--color-field-border', '--color-field-bg', UI, 'field border against the field'],
  ['--color-field-border', '--color-bg', UI, 'field border against the page'],
  ['--color-field-border-focus', '--color-field-bg', UI, 'focused field border'],
  ['--color-text', '--color-field-bg', TEXT, 'typed text'],
  ['--color-border-strong', '--color-bg', UI, 'strong borders (checkbox, kbd)'],
  ['--color-danger', '--color-bg', TEXT, 'error text'],
  ['--color-danger', '--color-danger-subtle', TEXT, 'error text in alerts'],
  ['--color-success', '--color-bg', TEXT, 'success text'],
  ['--color-success', '--color-success-subtle', TEXT, 'success text in alerts'],
  ['--color-warning', '--color-bg', TEXT, 'warning text'],
  ['--color-warning', '--color-warning-subtle', TEXT, 'warning text in alerts'],
  ['--color-info', '--color-bg', TEXT, 'info text'],
  ['--color-info', '--color-info-subtle', TEXT, 'info text in alerts'],
  ['--color-text', '--color-danger-subtle', TEXT, 'alert body text'],
  ['--color-text', '--color-warning-subtle', TEXT, 'alert body text'],
  ['--color-sale', '--color-bg', TEXT, 'sale price (text)'],
  ['--color-sale', '--color-surface', TEXT, 'sale price on cards'],
  ['--color-rating', '--color-bg', UI, 'rating stars (graphical)'],
  ['--color-rating', '--color-surface', UI, 'rating stars on cards'],
  ['--color-code-text', '--color-code-bg', TEXT, 'inline code'],
  ['--color-text', '--color-table-header-bg', TEXT, 'table header'],
  ['--color-quote-border', '--color-bg', UI, 'quote rule'],
];

/** Text over the media scrim (Hero text uses the inverse surface), on the worst-case images: white and black. */
const mediaPair = (theme: string) => {
  const inverse = tokenMap(theme, 'inverse');
  return Math.min(
    ...['#ffffff', '#000000'].map((image) => {
      const scrim = colourOf(inverse, '--color-overlay-media', parseColour(image));
      return contrast(colourOf(inverse, '--color-text', scrim), scrim);
    }),
  );
};

const surfaces: Surface[] = ['page', 'inverse'];

describe.each(themes.map((t) => t.name))('theme %s', (theme) => {
  it('resolves every semantic token on both surfaces (no unresolved var())', () => {
    for (const surface of surfaces) {
      const map = tokenMap(theme, surface);
      for (const token of Object.keys(map).filter((k) => !/^--(neutral|teal|red|green|amber|black-alpha|space|font|radius|shadow|line-height|border-\d|container|breakpoint|duration|easing)/.test(k))) {
        expect(() => resolve(map, token), `${theme}/${surface} ${token}`).not.toThrow();
      }
    }
  });

  it.each(surfaces)('meets contrast on the %s surface', (surface) => {
    const map = tokenMap(theme, surface);
    const page = colourOf(map, '--color-bg');
    const rows = pairs.map(([fg, bg, min, why]) => {
      const back = colourOf(map, bg, page);
      const ratio = contrast(colourOf(map, fg, back), back);
      return { fg, bg, ratio: Math.round(ratio * 100) / 100, min, why, ok: ratio >= min };
    });
    const failures = rows.filter((r) => !r.ok);
    if (failures.length) console.table(failures.map(({ fg, bg, ratio, min, why }) => ({ fg, bg, ratio, min, why })));
    expect(failures.map((r) => `${r.fg} on ${r.bg}: ${r.ratio} < ${r.min} (${r.why})`), `${theme}/${surface}`).toEqual([]);
  });

  it('inverse surfaces contrast with the page and text over the media scrim passes', () => {
    const page = tokenMap(theme, 'page');
    expect(contrast(colourOf(page, '--color-text-inverse'), colourOf(page, '--color-bg-inverse'))).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(colourOf(page, '--color-bg'), colourOf(page, '--color-bg-inverse'))).toBeGreaterThanOrEqual(UI);
    expect(mediaPair(theme)).toBeGreaterThanOrEqual(TEXT);
  });
});
