import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { cardEdgeCases, cards } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Badge } from '../Badge';
import { Link } from '../Link';
import { Card, CardGrid } from './Card';
import { vrtEdges } from '../../stories/vrt';

const meta = {
  title: 'Sections/Card',
  component: Card,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { ...cards[0]!, variant: 'outlined', orientation: 'vertical' },
  render: (args) => (
    <div style={{ maxInlineSize: '24rem' }}>
      <Card {...args} />
    </div>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outlined: Story = {
  parameters: { ...vrtEdges },
  play: async ({ canvasElement }) => {
    // The whole card is clickable through exactly one real link (the title).
    const links = within(canvasElement).getAllByRole('link');
    await expect(links).toHaveLength(1);
    await expect(links[0]).toHaveAccessibleName(cards[0]!.title);
  },
};

export const Elevated: Story = {
  parameters: { ...vrtEdges },
  args: { variant: 'elevated' },
};

export const Flat: Story = {
  parameters: { ...vrtEdges },
  args: { variant: 'flat' },
};

export const WithBadgeEyebrow: Story = {
  parameters: { ...vrtEdges },
  args: { eyebrow: <Badge tone="accent" size="sm">New</Badge> },
};

/** Footer content sits at the bottom; links in it stay clickable above the stretched card link. */
export const WithFooter: Story = {
  parameters: { ...vrtEdges },
  args: {
    footer: (
      <Link href="/work/cleanup/download" variant="standalone">
        Download the PDF
      </Link>
    ),
  },
};

/** Image beside the body when the card is at least 32rem wide; stacked below that. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <Card {...args} />
    </div>
  ),
};

/** Keyboard focus on the title link draws the focus ring around the whole card. */
export const FocusState: Story = {
  parameters: { ...vrtEdges },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('link')).toHaveFocus();
  },
};

export const Grid: Story = {
  render: () => (
    <CardGrid>
      {cards.map((card) => (
        <Card key={card.title} {...card} />
      ))}
    </CardGrid>
  ),
};

export const GridOneItem: Story = {
  render: () => (
    <CardGrid>
      <Card {...cards[0]!} />
    </CardGrid>
  ),
};

export const GridTwoItems: Story = {
  render: () => (
    <CardGrid>
      {cards.slice(0, 2).map((card) => (
        <Card key={card.title} {...card} />
      ))}
    </CardGrid>
  ),
};

/** Long title, one-word title, no image, no description, unbroken string, failed image: rows stay equal height. */
export const GridEdgeCases: Story = {
  render: () => (
    <CardGrid>
      {Object.values(cardEdgeCases).map((card) => (
        <Card key={card.title} {...card} />
      ))}
    </CardGrid>
  ),
};

export const GridElevatedOnSubtle: Story = {
  parameters: { surface: 'subtle' },
  render: () => (
    <CardGrid>
      {cards.slice(0, 3).map((card) => (
        <Card key={card.title} {...card} variant="elevated" />
      ))}
    </CardGrid>
  ),
};

export const GridOnInverse: Story = {
  parameters: { surface: 'inverse' },
  render: () => (
    <CardGrid>
      {cards.slice(0, 3).map((card) => (
        <Card key={card.title} {...card} />
      ))}
    </CardGrid>
  ),
};
