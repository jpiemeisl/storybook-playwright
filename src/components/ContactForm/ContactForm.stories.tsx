import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  consentLabel,
  filledContact,
  invalidContact,
  longValuesContact,
  serverErrorMessage,
  subjectOptions,
  subjectOptionsTwelve,
  successMessage,
} from '../../fixtures/forms';
import { inSection } from '../../stories/inSection';
import { ContactForm } from './ContactForm';

const meta = {
  title: 'Forms/ContactForm',
  component: ContactForm,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { subjectOptions, onSubmit: fn(), consentLabel },
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <ContactForm {...args} />
    </div>
  ),
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const WithoutConsent: Story = {
  args: { consentLabel: undefined },
};

export const Filled: Story = {
  args: { defaultValues: { ...filledContact, consent: true } },
};

/**
 * Empty submit: the error summary appears, takes focus and lists each problem; each link moves focus
 * to its field. Fields get aria-invalid and inline errors. onSubmit is not called.
 */
export const ValidationErrors: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    const summary = canvas.getByRole('alert');
    await expect(summary).toHaveFocus();
    await expect(summary).toHaveTextContent('There is a problem');
    const links = within(summary).getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual([
      'Enter your full name',
      'Enter your email address',
      'Choose a subject',
      'Enter your message',
      'Tick the box to agree before sending',
    ]);
    await userEvent.click(within(summary).getByRole('link', { name: 'Choose a subject' }));
    await expect(canvas.getByRole('combobox', { name: /Subject/ })).toHaveFocus();
    await userEvent.click(within(summary).getByRole('link', { name: 'Enter your message' }));
    await expect(canvas.getByRole('textbox', { name: /Message/ })).toHaveFocus();
    await expect(canvas.getByRole('textbox', { name: /Full name/ })).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onSubmit).not.toHaveBeenCalled();
    // Leave focus on the summary for the screenshot.
    summary.focus();
  },
};

/** Type mismatch, too short and missing values together. */
export const InvalidEverything: Story = {
  args: { defaultValues: invalidContact, subjectOptions: subjectOptionsTwelve },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    const summary = canvas.getByRole('alert');
    await expect(summary).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    await expect(summary).toHaveTextContent('Message must be 10 characters or more');
  },
};

/** After the first submit, fixing a field and leaving it clears its error. */
export const ErrorClearsOnBlur: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Send message' }));
    const name = canvas.getByRole('textbox', { name: /Full name/ });
    await userEvent.type(name, 'Priya Natarajan');
    await userEvent.tab();
    await waitFor(() => expect(name).not.toHaveAttribute('aria-invalid'));
    await expect(within(canvas.getByRole('alert')).queryByRole('link', { name: 'Enter your full name' })).toBeNull();
  },
};

export const ValidSubmit: Story = {
  args: { defaultValues: { ...filledContact, consent: true } },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Send message' }));
    await expect(args.onSubmit).toHaveBeenCalledWith({ ...filledContact, consent: true });
  },
};

export const Submitting: Story = {
  args: { status: 'submitting', defaultValues: { ...filledContact, consent: true } },
};

/** Success keeps the values visible but disabled; onReset adds "Send another message". */
export const Success: Story = {
  args: { status: 'success', successMessage, onReset: fn(), defaultValues: { ...filledContact, consent: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Message sent');
    await expect(canvas.getByRole('textbox', { name: /Full name/ })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Send another message' })).toBeEnabled();
  },
};

export const ServerError: Story = {
  args: { status: 'error', errorMessage: serverErrorMessage, defaultValues: { ...filledContact, consent: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Message not sent');
    await expect(canvas.getByRole('textbox', { name: /Full name/ })).toBeEnabled();
  },
};

/** Very long name and email, a long subject label, and a 2,000-character message. */
export const LongValues: Story = {
  args: { subjectOptions: subjectOptionsTwelve, defaultValues: longValuesContact },
};

export const OnSubtleSection: Story = {
  parameters: { surface: 'subtle' },
};
