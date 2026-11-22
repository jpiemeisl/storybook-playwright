import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Section, type SectionBackground } from '../components/Section';
import { Theme, themes, type ThemeName } from '../components/Theme';
import styles from './Themes.module.css';

/*
 * Nested themes and inverse regions. A harbor section inside an orchard page and the reverse, plus every
 * Section background in every theme: inverse regions must contrast with their page, and a nested theme
 * must use its own tokens all the way down.
 */

const backgrounds: SectionBackground[] = ['default', 'subtle', 'accent', 'inverse'];

function Sample({ label }: { label: string }) {
  return (
    <div className={styles.sample}>
      <h3 className={styles.heading}>{label}</h3>
      <p>
        Body text, <span className={styles.muted}>muted text</span> and a <a href="#nested">link</a>.
      </p>
      <div className={styles.row}>
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
      </div>
    </div>
  );
}

const meta = { title: 'Themes/Nested', tags: ['vrt-full'], parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const pair = (outer: ThemeName, inner: ThemeName) => (
  <Theme name={outer} className={styles.page} data-testid={`${outer}-page`}>
    <Container size="lg">
      <Sample label={`${outer} page`} />
      <Theme name={inner} as="section" className={styles.nested} aria-label={`${inner} inside ${outer}`} data-testid={`${inner}-in-${outer}`}>
        <Sample label={`${inner} section inside ${outer}`} />
        <Section background="inverse" padding="sm">
          <Sample label={`${inner} inverse region`} />
        </Section>
      </Theme>
    </Container>
  </Theme>
);

export const NestedThemes: Story = {
  tags: ['vrt-full'],
  render: () => (
    <div>
      {pair('orchard', 'harbor')}
      {pair('harbor', 'orchard')}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const value = (el: HTMLElement, token: string) => getComputedStyle(el).getPropertyValue(token).trim();
    const harborInOrchard = canvas.getByTestId('harbor-in-orchard');
    const orchardPage = canvas.getByTestId('orchard-page');
    await expect(value(harborInOrchard, '--color-bg')).toBe('#0f1a2b');
    await expect(value(orchardPage, '--color-bg')).toBe('#fbfdfb');
    // The orchard section inside harbor resolves orchard tokens, not harbor's.
    await expect(value(canvas.getByTestId('orchard-in-harbor'), '--color-action')).toBe('#6b2d5c');
  },
};

/** Every Section background in every theme. */
export const SectionBackgrounds: Story = {
  tags: ['vrt-full'],
  render: () => (
    <div className={styles.grid}>
      {themes.map((t) => (
        <Theme key={t.name} name={t.name} className={styles.column} aria-label={`${t.label} sections`} role="group">
          {backgrounds.map((bg) => (
            <Section key={bg} background={bg} padding="sm">
              <Container>
                <Sample label={`${t.label}: ${bg}`} />
              </Container>
            </Section>
          ))}
        </Theme>
      ))}
    </div>
  ),
};

const tokenOf = (el: Element, token: string) => getComputedStyle(el).getPropertyValue(token).trim();
/** The decorator's <Theme> wrapper, inside the canvas. */
const storyRoot = (canvasElement: HTMLElement) => canvasElement.querySelector('[data-theme]')!;

/** The toolbar's theme global (here set by the story) changes --color-bg and --color-action on the story root and <html>. */
export const ToolbarDefault: Story = {
  parameters: { layout: 'padded', vrt: { screenshot: false } },
  render: () => <p>Default theme from the toolbar.</p>,
  play: async ({ canvasElement }) => {
    await expect(tokenOf(storyRoot(canvasElement), '--color-action').toLowerCase()).toMatch(/^(#0b625e|var\(--teal-600\))$/);
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveAttribute('data-theme', 'default'));
  },
};

export const ToolbarHarbor: Story = {
  globals: { theme: 'harbor' },
  parameters: { layout: 'padded', vrt: { screenshot: false } },
  render: () => <p>Harbor theme from the toolbar.</p>,
  play: async ({ canvasElement }) => {
    await expect(tokenOf(storyRoot(canvasElement), '--color-bg')).toBe('#0f1a2b');
    await expect(tokenOf(storyRoot(canvasElement), '--color-action')).toBe('#f2b134');
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveAttribute('data-theme', 'harbor'));
  },
};

export const ToolbarOrchard: Story = {
  globals: { theme: 'orchard' },
  parameters: { layout: 'padded', vrt: { screenshot: false } },
  render: () => <p>Orchard theme from the toolbar.</p>,
  play: async ({ canvasElement }) => {
    await expect(tokenOf(storyRoot(canvasElement), '--color-bg')).toBe('#fbfdfb');
    await expect(tokenOf(storyRoot(canvasElement), '--color-action')).toBe('#6b2d5c');
  },
};

/** <Theme> renders exactly one element with data-theme and no stray DOM. */
export const ThemeElement: Story = {
  parameters: { layout: 'padded', vrt: { screenshot: false } },
  render: () => (
    <div data-testid="host">
      <Theme name="harbor" as="section" aria-label="Harbor panel">
        <span>content</span>
      </Theme>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId('host');
    await expect(host.children).toHaveLength(1);
    const panel = host.firstElementChild!;
    await expect(panel.tagName).toBe('SECTION');
    await expect(panel.getAttribute('data-theme')).toBe('harbor');
    await expect(host.querySelectorAll('[data-theme]')).toHaveLength(1);
    await expect(panel.innerHTML).toBe('<span>content</span>');
  },
};
