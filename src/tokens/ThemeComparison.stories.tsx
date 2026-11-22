import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from '../components/Button';
import { Theme, themes } from '../components/Theme';
import styles from './ThemeComparison.module.css';

/*
 * Each theme side by side: colour swatches, type, radii, shadows, borders and the focus ring. Every
 * panel is a <Theme>, so this one story shows all themes regardless of the toolbar.
 */

const swatches = ['bg', 'bg-subtle', 'surface', 'bg-inverse', 'border', 'border-strong', 'text', 'text-muted', 'action', 'action-subtle', 'link', 'focus-ring', 'danger', 'success', 'warning', 'info', 'sale', 'rating'];

function Panel({ name, label }: { name: (typeof themes)[number]['name']; label: string }) {
  return (
    <Theme name={name} className={styles.panel} aria-label={`${label} theme`} role="group">
      <h2 className={styles.title}>{label}</h2>
      <ul className={styles.swatches}>
        {swatches.map((s) => (
          <li key={s}>
            <span className={styles.chip} style={{ background: `var(--color-${s})` }} aria-hidden="true" />
            <code>--color-{s}</code>
          </li>
        ))}
      </ul>
      <div className={styles.type}>
        <p className={styles.h1}>Heading 2xl</p>
        <p className={styles.h2}>Heading lg</p>
        <p>Body text with a <a href="#link">link</a> and <code>inline code</code>.</p>
        <p className={styles.muted}>Muted supporting text.</p>
      </div>
      <div className={styles.shapes}>
        <span className={styles.control}>Control radius</span>
        <span className={styles.surface}>Surface radius</span>
        <span className={styles.pill}>Pill</span>
      </div>
      <div className={styles.shadows}>
        <span style={{ boxShadow: 'var(--elevation-low)' }}>Low</span>
        <span style={{ boxShadow: 'var(--elevation-mid)' }}>Mid</span>
        <span style={{ boxShadow: 'var(--elevation-high)' }}>High</span>
      </div>
      <div className={styles.focus}>
        <Button variant="secondary">Focus ring</Button>
        <span className={styles.ring}>Ring sample</span>
      </div>
    </Theme>
  );
}

const meta = { title: 'Foundations/Theme comparison', tags: ['vrt-full'], parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const AllThemes: Story = {
  tags: ['vrt-full'],
  render: () => (
    <div className={styles.grid}>
      {themes.map((t) => (
        <Panel key={t.name} name={t.name} label={t.label} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const panels = within(canvasElement).getAllByRole('group');
    await expect(panels).toHaveLength(themes.length);
    const bgs = panels.map((p) => getComputedStyle(p).backgroundColor);
    await expect(new Set(bgs).size).toBe(themes.length); // each panel resolves its own tokens
  },
};
