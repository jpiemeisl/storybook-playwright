import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Link } from '../Link';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Section, type SectionBackground, type SectionPadding } from './Section';

const meta = {
  title: 'Layout/Section',
  component: Section,
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
  args: { background: 'default', padding: 'md' },
  argTypes: {
    background: { control: 'inline-radio', options: ['default', 'subtle', 'accent', 'inverse'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

function SectionContent({ title }: { title: string }) {
  return (
    <Container>
      <Stack gap="md" align="start">
        <Badge tone="accent">Case study</Badge>
        <Heading size="2xl">{title}</Heading>
        <Text tone="muted" style={{ maxInlineSize: '40rem' }}>
          Muted supporting text stays readable on every background. Read the{' '}
          <Link href="/case-studies/retail">full write-up</Link> for details.
        </Text>
        <Stack direction="row" gap="sm" wrap>
          <Button>Book a call</Button>
          <Button variant="secondary">See pricing</Button>
        </Stack>
      </Stack>
    </Container>
  );
}

const backgrounds: SectionBackground[] = ['default', 'subtle', 'accent', 'inverse'];

export const Playground: Story = {
  tags: ['skip-vrt'],
  args: { children: <SectionContent title="Section playground" /> },
};

/** All four backgrounds with the same content, including links, badges and buttons. */
export const Backgrounds: Story = {
  render: (args) => (
    <>
      {backgrounds.map((background) => (
        <Section key={background} {...args} background={background}>
          <SectionContent title={`background="${background}"`} />
        </Section>
      ))}
    </>
  ),
};

/** Inverse remaps the semantic tokens, so nested components adapt without extra props. */
export const Inverse: Story = {
  args: { background: 'inverse', padding: 'lg' },
  render: (args) => (
    <Section {...args}>
      <SectionContent title="Ready to make your product accessible?" />
    </Section>
  ),
};

/** Padding steps are fluid: compare across viewport widths. */
export const Padding: Story = {
  render: () => (
    <>
      {(['none', 'sm', 'md', 'lg'] as SectionPadding[]).map((padding, i) => (
        <Section key={padding} padding={padding} background={i % 2 ? 'subtle' : 'accent'}>
          <Container>
            <Text weight="strong">padding="{padding}"</Text>
          </Container>
        </Section>
      ))}
    </>
  ),
};

/** Polymorphic: a page footer band rendered as `<footer>`. */
export const AsFooter: Story = {
  render: () => (
    <Section as="footer" background="subtle" padding="sm">
      <Container>
        <Stack direction="row" justify="between" align="center" wrap gap="md">
          <Text size="sm" tone="muted">
            © 2026 Pattern Library Ltd.
          </Text>
          <Stack as="nav" aria-label="Legal" direction="row" gap="md">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </Stack>
        </Stack>
      </Container>
    </Section>
  ),
};
