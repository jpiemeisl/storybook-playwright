import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Link } from './Link';
import { LinkProvider, type LinkComponentProps } from './LinkProvider';

const meta = {
  title: 'Primitives/Link',
  component: Link,
  args: {
    href: '/services',
    children: 'Explore our services',
    variant: 'inline',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['inline', 'standalone'] },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  tags: ['skip-vrt'],
};

export const Default: Story = {};

export const Standalone: Story = {
  args: { variant: 'standalone', children: 'Read the case study' },
};

/** Absolute URLs are external: plain `<a>`, rel="noopener noreferrer" and an icon. */
export const External: Story = {
  render: (args) => (
    <Stack gap="sm" align="start">
      <Link {...args} href="https://www.w3.org/WAI/" variant="inline">
        W3C accessibility guidelines
      </Link>
      <Link {...args} href="https://www.w3.org/WAI/" variant="standalone" target="_blank">
        Open the guidelines in a new tab
      </Link>
    </Stack>
  ),
};

export const InsideBodyText: Story = {
  render: (args) => (
    <Text style={{ maxInlineSize: '40rem' }}>
      We start every engagement with a short discovery phase. You can{' '}
      <Link {...args} href="/process">
        read about our process
      </Link>{' '}
      or check the{' '}
      <Link {...args} href="https://www.w3.org/WAI/standards-guidelines/wcag/">
        WCAG 2.2 standard
      </Link>{' '}
      that every deliverable is tested against before handover.
    </Text>
  ),
};

/** Keyboard focus ring. A play function focuses the link (React's autoFocus only applies to form controls). */
export const FocusVisible: Story = {
  render: (args) => (
    <Text>
      <Link {...args}>Focused link</Link>
    </Text>
  ),
  play: ({ canvasElement }) => {
    canvasElement.querySelector('a')?.focus();
  },
};

/** Links inherit the remapped action colour on an inverse Section. */
export const OnInverse: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Section background="inverse" padding="sm" style={{ paddingInline: 'var(--gutter)' }}>
      <Stack gap="sm" align="start">
        <Text>
          Body copy with an <Link {...args}>inline link</Link> on a dark background.
        </Text>
        <Link {...args} variant="standalone">
          Standalone link
        </Link>
      </Stack>
    </Section>
  ),
};

/* A stand-in for a framework link (Next.js, React Router) that marks what it rendered. */
function MockRouterLink({ children, ...props }: LinkComponentProps) {
  return (
    <a {...props} data-router-link="">
      {children} <Badge size="sm">router</Badge>
    </a>
  );
}

/** Internal links render through the component supplied to LinkProvider; external links stay plain `<a>`. */
export const CustomLinkProvider: Story = {
  render: (args) => (
    <LinkProvider component={MockRouterLink}>
      <Stack gap="sm" align="start">
        <Link {...args} href="/about">
          Internal link via provider
        </Link>
        <Link {...args} href="https://www.w3.org/">
          External link stays a plain anchor
        </Link>
      </Stack>
    </LinkProvider>
  ),
};
