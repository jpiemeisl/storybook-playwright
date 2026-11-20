import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '../components/Heading/Heading';
import { Text } from '../components/Text/Text';
import styles from './Foundations.module.css';

/*
 * Token reference pages. Token names are listed here by hand; keep them in sync with
 * semantic.css and primitives.css. Values are applied through CSS custom properties.
 */

const colorTokens = [
  'bg',
  'bg-subtle',
  'bg-muted',
  'surface',
  'border',
  'border-strong',
  'text',
  'text-muted',
  'text-subtle',
  'text-inverse',
  'action',
  'action-hover',
  'action-active',
  'action-subtle',
  'focus-ring',
  'disabled-bg',
  'disabled-text',
  'danger',
  'danger-subtle',
  'success',
  'success-subtle',
];

const typeSizes = ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
const spaceSteps = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'];
const radii = ['radius-0', 'radius-1', 'radius-2', 'radius-3', 'radius-4', 'radius-full'];

const meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: () => (
    <section className={styles.section}>
      <Heading size="2xl">Semantic colours</Heading>
      <div className={styles.grid}>
        {colorTokens.map((name) => (
          <div key={name} className={styles.swatch}>
            <div className={styles.chip} style={{ backgroundColor: `var(--color-${name})` }} />
            <span className={styles.label}>--color-{name}</span>
          </div>
        ))}
      </div>
    </section>
  ),
};

/** Fluid type: captured at mobile, tablet and desktop widths. */
export const TypeScale: Story = {
  tags: ['vrt-full'],
  render: () => (
    <section className={styles.section}>
      <Heading size="2xl">Type scale</Heading>
      {typeSizes.map((size) => (
        <div key={size} className={styles.row}>
          <span className={styles.label}>--text-size-{size}</span>
          <Text as="span" style={{ fontSize: `var(--text-size-${size})` }}>
            Aa Bb Cc 123
          </Text>
        </div>
      ))}
    </section>
  ),
};

export const Spacing: Story = {
  render: () => (
    <section className={styles.section}>
      <Heading size="2xl">Spacing (4px base)</Heading>
      {spaceSteps.map((step) => (
        <div key={step} className={styles.row}>
          <span className={styles.label}>--space-{step}</span>
          <div className={styles.bar} style={{ inlineSize: `var(--space-${step})` }} />
        </div>
      ))}
    </section>
  ),
};

export const Radii: Story = {
  render: () => (
    <section className={styles.section}>
      <Heading size="2xl">Radii</Heading>
      <div className={styles.grid}>
        {radii.map((name) => (
          <div key={name} className={styles.swatch}>
            <div className={styles.box} style={{ borderRadius: `var(--${name})` }} />
            <span className={styles.label}>--{name}</span>
          </div>
        ))}
      </div>
    </section>
  ),
};
