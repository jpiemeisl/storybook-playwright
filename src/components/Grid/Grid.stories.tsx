import type { Meta, StoryObj } from '@storybook/react-vite';
import { longUnbrokenString, Placeholder, services } from '../../stories/Placeholder';
import { Heading } from '../Heading';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Grid } from './Grid';

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['vrt-full'],
  args: { columns: 3, gap: 'md' },
  argTypes: {
    gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

function cards(count: number) {
  return services.slice(0, count).map((s) => (
    <Placeholder key={s.title} title={s.title}>
      {s.body}
    </Placeholder>
  ));
}

export const Playground: Story = {
  tags: ['skip-vrt'],
  args: { children: cards(6) },
};

export const TwoColumns: Story = {
  args: { columns: 2, children: cards(4) },
};

export const ThreeColumns: Story = {
  args: { columns: 3, children: cards(6) },
};

/** Steps down 4 → 3 → 2 → 1 as the slot narrows. */
export const FourColumns: Story = {
  args: { columns: 4, children: cards(8) },
};

/** Explicit counts per container size. */
export const ResponsiveObject: Story = {
  args: { columns: { base: 2, md: 3, lg: 6 }, children: cards(6) },
};

/** As many columns as fit with items at least 14rem wide. */
export const AutoFit: Story = {
  args: { minItemWidth: '14rem', children: cards(7) },
};

/** Rows stretch to the tallest item so card edges line up. */
export const UnevenHeights: Story = {
  args: {
    columns: 3,
    children: [
      <Placeholder key="a" title="Short" />,
      <Placeholder key="b" title="Medium">
        A couple of lines of supporting copy that make this card taller than its neighbour.
      </Placeholder>,
      <Placeholder key="c" title="Tall">
        Considerably more content: a full paragraph describing the service, who it is for, how long it takes and
        what you get at the end. This one sets the row height.
      </Placeholder>,
      <Placeholder key="d" title="Next row" />,
    ],
  },
};

export const SingleItem: Story = {
  args: { columns: 3, children: cards(1) },
};

export const TwelveItems: Story = {
  args: { columns: 4, children: cards(12) },
};

/** Edge case: no children renders an empty grid that takes no space. */
export const Empty: Story = {
  render: (args) => (
    <Stack gap="md">
      <Text tone="muted">Grid below has no items:</Text>
      <Grid {...args} />
      <Text tone="muted">Content after the empty grid.</Text>
    </Stack>
  ),
};

/** Edge case: long unbroken strings wrap inside their cell. */
export const LongUnbrokenString: Story = {
  args: {
    columns: 3,
    children: [
      <Placeholder key="a" title="Callback URL">
        {longUnbrokenString}
      </Placeholder>,
      <Placeholder key="b" title="Supercalifragilisticexpialidociousandthensomemorecharacters" />,
      <Placeholder key="c" title="Normal item">Wraps as usual.</Placeholder>,
    ],
  },
};

/**
 * Container queries: the same `columns={3}` Grid in a narrow sidebar and a wide main column.
 * The sidebar grid collapses based on its own width, not the viewport.
 */
export const RespondsToSlot: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-lg)' }}>
      <Stack as="aside" gap="sm" style={{ flex: '0 1 18rem' }}>
        <Heading size="md">Sidebar (18rem)</Heading>
        <Grid {...args} columns={3}>
          {cards(3)}
        </Grid>
      </Stack>
      <Stack gap="sm" style={{ flex: '1 1 24rem' }}>
        <Heading size="md">Main column</Heading>
        <Grid {...args} columns={3}>
          {cards(3)}
        </Grid>
      </Stack>
    </div>
  ),
};

/** Polymorphic: a semantic list. */
export const AsList: Story = {
  render: (args) => (
    <Grid {...args} as="ul" columns={3}>
      {services.slice(0, 3).map((s) => (
        <li key={s.title}>
          <Placeholder title={s.title}>{s.body}</Placeholder>
        </li>
      ))}
    </Grid>
  ),
};
