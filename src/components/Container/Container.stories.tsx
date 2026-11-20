import type { Meta, StoryObj } from '@storybook/react-vite';
import { Placeholder, Ruler } from '../../stories/Placeholder';
import { Heading } from '../Heading';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Container, type ContainerSize } from './Container';

const meta = {
  title: 'Layout/Container',
  component: Container,
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
  args: { size: 'lg' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const sizes: { size: ContainerSize; label: string }[] = [
  { size: 'sm', label: 'sm · 40rem' },
  { size: 'md', label: 'md · 48rem' },
  { size: 'lg', label: 'lg · 72rem' },
  { size: 'xl', label: 'xl · 80rem' },
  { size: 'full', label: 'full · gutters only' },
];

export const Playground: Story = {
  tags: ['skip-vrt'],
  args: { children: <Ruler>Container content</Ruler> },
};

/** Each bar is the content box; the space either side is the fluid --gutter. */
export const Sizes: Story = {
  render: () => (
    <Stack gap="md" style={{ paddingBlock: 'var(--gap-md)' }}>
      {sizes.map(({ size, label }) => (
        <Container key={size} size={size}>
          <Ruler>{label}</Ruler>
        </Container>
      ))}
    </Stack>
  ),
};

/** A narrow reading column inside a wide page container: the inner one does not add a second gutter. */
export const Nested: Story = {
  render: () => (
    <Container size="xl" style={{ paddingBlock: 'var(--gap-md)' }}>
      <Stack gap="md">
        <Ruler>Outer container (xl)</Ruler>
        <Container size="sm">
          <Ruler>Inner container (sm), centred, no extra gutter</Ruler>
        </Container>
      </Stack>
    </Container>
  ),
};

/** Polymorphic: renders as `<main>` / `<article>` with realistic page content. */
export const ArticleLayout: Story = {
  render: () => (
    <Section padding="md">
      <Container as="article" size="md">
        <Stack gap="md">
          <Heading as="h1" size="3xl">
            How we run accessibility audits
          </Heading>
          <Text size="lg" tone="muted">
            A practical walkthrough of our process, from automated scans to testing with screen reader users.
          </Text>
          <Text>
            Automated tools catch roughly a third of real-world issues. The rest need people: keyboard-only passes,
            screen reader sessions and careful review of content and focus order. Each finding is written up with
            the affected component, the WCAG criterion and a suggested fix your developers can pick up directly.
          </Text>
          <Placeholder title="Key takeaway">
            Fix issues in shared components first; one change often resolves dozens of pages.
          </Placeholder>
        </Stack>
      </Container>
    </Section>
  ),
};
