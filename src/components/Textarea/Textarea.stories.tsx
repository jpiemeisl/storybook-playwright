import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { filledContact, message2000 } from '../../fixtures/forms';
import { narrow } from '../../stories/inSection';
import { Field } from '../Field';
import { Textarea } from './Textarea';

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  tags: ['vrt-mobile'],
  decorators: [narrow],
  args: { 'aria-label': 'Message', placeholder: 'How can we help?' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { defaultValue: filledContact.message },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('textbox')).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { defaultValue: filledContact.message, disabled: true },
};

export const ReadOnly: Story = {
  args: { defaultValue: filledContact.message, readOnly: true },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Message" required error="Message must be 10 characters or more">
      <Textarea defaultValue="Hi" />
    </Field>
  ),
};

/** Grows with its content (CSS field-sizing), up to 20 lines, then scrolls. */
export const AutoGrow: Story = {
  args: { autoGrow: true, rows: 3, defaultValue: `${filledContact.message}\n\n${filledContact.message}` },
};

/** At the 2,000-character limit. */
export const LongValueAtLimit: Story = {
  args: { autoGrow: true, showCount: true, maxLength: 2000, defaultValue: message2000 },
};

/**
 * Counter: the visible "n / max" is aria-hidden; the limit is in the description and the remaining
 * count is announced politely once typing pauses for a second (not on every keystroke).
 */
export const WithCounter: Story = {
  args: { showCount: true, maxLength: 200 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox');
    await expect(textarea).toHaveAccessibleDescription('Up to 200 characters.');
    await userEvent.type(textarea, 'Payroll question');
    await expect(canvas.getByText('16 / 200')).toBeInTheDocument();
    const live = canvasElement.querySelector('[aria-live="polite"]');
    await expect(live).toHaveTextContent('');
    await waitFor(() => expect(live).toHaveTextContent('184 characters remaining'), { timeout: 3000 });
  },
};
