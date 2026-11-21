import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { narrow } from '../../stories/inSection';
import { FieldError, HelpText } from '../HelpText';
import { Input } from '../Input';
import { Label } from '../Label';
import { Field } from './Field';

const meta = {
  title: 'Forms/Field',
  component: Field,
  decorators: [narrow],
  args: { label: 'Email address', children: <Input type="email" name="email" /> },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const Optional: Story = {
  args: { label: 'Phone number', optional: true, children: <Input type="tel" name="phone" /> },
};

export const WithHint: Story = {
  args: { hint: 'We’ll only use this to reply to you.' },
};

export const WithError: Story = {
  args: { required: true, error: 'Enter an email address in the correct format, like name@example.com', children: <Input type="email" defaultValue="priya-at-copperleaf" /> },
};

/**
 * Wiring: clicking the label focuses the control; aria-describedby lists the hint then the error;
 * aria-invalid and required are set.
 */
export const HintAndError: Story = {
  args: {
    required: true,
    hint: 'We’ll only use this to reply to you.',
    error: 'Enter your email address',
    children: <Input type="email" name="email" aria-describedby="external-note" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Email address' });
    await userEvent.click(canvas.getByText('Email address'));
    await expect(input).toHaveFocus();
    const [hintId, errorId, externalId] = (input.getAttribute('aria-describedby') ?? '').split(' ');
    await expect(document.getElementById(hintId!)).toHaveTextContent('We’ll only use this to reply to you.');
    await expect(document.getElementById(errorId!)).toHaveTextContent('Enter your email address');
    await expect(externalId).toBe('external-note');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription('We’ll only use this to reply to you. Error: Enter your email address');
  },
};

export const LongLabelWraps: Story = {
  args: {
    label: 'The email address we should use for invoices, payroll reports and anything else related to your account',
    required: true,
    hint: 'Usually your accounts or finance inbox rather than a personal address, so that messages still reach the right person when someone is away.',
  },
};

/** Render prop: the control gets the wiring props explicitly. */
export const RenderProp: Story = {
  args: {
    label: 'Company number',
    hint: '8 characters, for example 01234567',
    children: (props) => <Input {...props} name="company" inputMode="numeric" pattern="[0-9A-Z]{8}" />,
  },
};

/** The building blocks on their own. */
export const BuildingBlocks: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-sm)' }}>
      <Label>Plain label</Label>
      <Label required>Required label</Label>
      <Label optional>Optional label</Label>
      <HelpText>Help text gives a short hint about the expected value.</HelpText>
      <FieldError>Error text pairs an icon with the message so it does not rely on colour.</FieldError>
    </div>
  ),
};
