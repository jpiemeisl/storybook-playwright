import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { GENERIC_LOGIN_ERROR } from '../../logic/authForms';
import layout from '../../stories/storyLayout.module.css';
import { LoginForm, type LoginFormProps } from './LoginForm';

const meta = { title: 'Commerce/Account/LoginForm', component: LoginForm, tags: ['vrt-mobile'] } satisfies Meta<typeof LoginForm>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const links = { forgotPassword: '/account/forgot-password', register: '/account/register' };
const cell = (label: string, props: Partial<LoginFormProps> = {}) => (
  <section aria-label={label} data-testid={label}>
    <p className={layout.label}>{label}</p>
    <LoginForm links={links} hiddenFields={<input type="hidden" name="csrf" value="demo-token" />} {...props} />
  </section>
);

/** Idle, errors (after submit), submitting, server error and password visible. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(22rem, 100%), 1fr))', alignItems: 'start' }}>
      {cell('Idle')}
      {cell('Errors')}
      {cell('Submitting', { status: 'submitting' })}
      {cell('Server error', { status: 'error' })}
      {cell('Password visible')}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(within(canvas.getByTestId('Errors')).getByRole('button', { name: 'Sign in' }));
    const visible = within(canvas.getByTestId('Password visible'));
    await userEvent.type(visible.getByLabelText(/^Password/, { selector: 'input' }), 'compost-heap-7');
    await userEvent.click(visible.getByRole('button', { name: 'Show password' }));
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
  },
};

function Live() {
  const [status, setStatus] = useState<LoginFormProps['status']>('idle');
  return <LoginForm links={links} status={status} onSubmit={() => setStatus('error')} />;
}

/** A real POST form with named fields and the right autocomplete tokens; errors focus the summary; the server error is generic. */
export const FormContract: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector('form')!;
    await expect(form).toHaveAttribute('method', 'post');
    const email = canvas.getByRole('textbox', { name: /^Email/ });
    const password = canvas.getByLabelText(/^Password/, { selector: 'input' });
    await expect(email).toHaveAttribute('name', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'username');
    await expect(password).toHaveAttribute('name', 'password');
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveFocus());
    await userEvent.click(canvas.getByRole('link', { name: 'Enter your password' }));
    await expect(password).toHaveFocus();
    // Toggle: aria-pressed and a constant name.
    const toggle = canvas.getByRole('button', { name: 'Show password' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(password).toHaveAttribute('type', 'text');
    await userEvent.click(toggle);
    // Valid submit → server error: generic wording, focused.
    await userEvent.type(email, 'robin@example.com');
    await userEvent.type(password, 'wrong-password-1');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    const alert = await canvas.findByText(GENERIC_LOGIN_ERROR);
    await waitFor(() => expect(alert.closest('[role="alert"]')).toHaveFocus());
    await expect(canvasElement).not.toHaveTextContent(/no account|not found|does not exist/i);
  },
};
