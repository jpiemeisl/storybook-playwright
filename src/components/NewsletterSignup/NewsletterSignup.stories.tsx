import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { newsletterConsentLabel } from '../../fixtures/forms';
import { inSection } from '../../stories/inSection';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Section, type SectionBackground } from '../Section';
import { Stack } from '../Stack';
import { NewsletterSignup } from './NewsletterSignup';
import { vrtEdges } from '../../stories/vrt';

const meta = {
  title: 'Forms/NewsletterSignup',
  component: NewsletterSignup,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { onSubmit: fn(), layout: 'inline' },
  render: (args) => (
    <div style={{ maxInlineSize: '40rem' }}>
      <NewsletterSignup {...args} />
    </div>
  ),
} satisfies Meta<typeof NewsletterSignup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const Stacked: Story = {
  args: { layout: 'stacked' },
};

export const WithNameAndConsent: Story = {
  args: { showName: true, consentLabel: newsletterConsentLabel },
};

/** Empty submit: inline errors, focus on the first invalid field, onSubmit not called. */
export const ValidationErrors: Story = {
  args: { showName: true, consentLabel: newsletterConsentLabel },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));
    const email = canvas.getByRole('textbox', { name: /Email address/ });
    await expect(email).toHaveFocus();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Error: Enter your email address');
    await expect(canvas.getByRole('checkbox')).toHaveAccessibleDescription('Error: Tick the box to agree before subscribing');
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const ValidSubmit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: /Email address/ }), 'priya@copperleaf.example');
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));
    await expect(args.onSubmit).toHaveBeenCalledWith({ email: 'priya@copperleaf.example', name: undefined, consent: undefined });
  },
};

export const Submitting: Story = {
  parameters: { ...vrtEdges },
  args: { status: 'submitting' },
};

export const Success: Story = {
  parameters: { ...vrtEdges },
  args: { status: 'success' },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await expect(status).toHaveTextContent('Success: You’re subscribed');
    await expect(within(canvasElement).queryByRole('button', { name: 'Subscribe' })).toBeNull();
  },
};

export const ServerError: Story = {
  parameters: { ...vrtEdges },
  args: { status: 'error', errorMessage: 'We couldn’t reach our mailing list provider. Please try again.' },
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveTextContent('We couldn’t reach our mailing list provider.');
    await expect(within(canvasElement).getByRole('button', { name: 'Subscribe' })).toBeEnabled();
  },
};

const backgrounds: SectionBackground[] = ['default', 'subtle', 'accent', 'inverse'];

function OnBackgrounds({ layout }: { layout: 'inline' | 'stacked' }) {
  return (
    <>
      {backgrounds.map((background) => (
        <Section key={background} background={background} padding="sm">
          <Container size="md">
            <Stack gap="md">
              <Heading size="lg">Monthly tips on {background}</Heading>
              <NewsletterSignup onSubmit={() => {}} layout={layout} showName consentLabel={newsletterConsentLabel} />
            </Stack>
          </Container>
        </Section>
      ))}
    </>
  );
}

/** Inline layout on every Section background; the inverse one shows a focused field. */
export const InlineOnBackgrounds: Story = {
  parameters: { bare: true },
  render: () => <OnBackgrounds layout="inline" />,
  play: async ({ canvasElement }) => {
    const emails = within(canvasElement).getAllByRole('textbox', { name: /Email address/ });
    emails[emails.length - 1]!.focus();
  },
};

export const StackedOnBackgrounds: Story = {
  parameters: { bare: true },
  render: () => <OnBackgrounds layout="stacked" />,
};

/** Error and validation states on inverse, where contrast is hardest. */
export const ErrorsOnInverse: Story = {
  parameters: { surface: 'inverse' },
  args: { status: 'error', showName: true, consentLabel: newsletterConsentLabel },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Subscribe' }));
  },
};
