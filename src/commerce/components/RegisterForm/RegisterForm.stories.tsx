import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Alert } from '../../../components/Alert';
import layout from '../../stories/storyLayout.module.css';
import { RegisterForm, type RegisterFormProps } from './RegisterForm';

const meta = { title: 'Commerce/Account/RegisterForm', component: RegisterForm, tags: ['vrt-mobile'] } satisfies Meta<typeof RegisterForm>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const links = { signIn: '/account/login', terms: '/terms', privacy: '/privacy' };
const cell = (label: string, props: Partial<RegisterFormProps> = {}) => (
  <section aria-label={label} data-testid={label}>
    <p className={layout.label}>{label}</p>
    <RegisterForm links={links} {...props} />
  </section>
);

/** Idle, errors, checklist partial and complete, submitting, server error, success. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(22rem, 100%), 1fr))', alignItems: 'start' }}>
      {cell('Idle')}
      {cell('Errors')}
      {cell('Checklist partial')}
      {cell('Checklist complete')}
      {cell('Submitting', { status: 'submitting' })}
      {cell('Server error', { status: 'error' })}
      {cell('Success', { status: 'success', successMessage: <Alert tone="success" title="Account created">Welcome! You’re signed in.</Alert> })}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(within(canvas.getByTestId('Errors')).getByRole('button', { name: 'Create account' }));
    await userEvent.type(within(canvas.getByTestId('Checklist partial')).getByLabelText(/^Password/, { selector: 'input' }), 'compost');
    await userEvent.type(within(canvas.getByTestId('Checklist complete')).getByLabelText(/^Password/, { selector: 'input' }), 'compost-heap-7');
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
  },
};

/** Named fields and autocomplete tokens; the checklist states pass or fail in text and announces a summary on blur. */
export const ChecklistAndContract: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <RegisterForm links={links} onSubmit={() => undefined} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: /^Name/ })).toHaveAttribute('autocomplete', 'name');
    await expect(canvas.getByRole('textbox', { name: /^Email/ })).toHaveAttribute('autocomplete', 'email');
    const password = canvas.getByLabelText(/^Password/, { selector: 'input' });
    await expect(password).toHaveAttribute('autocomplete', 'new-password');
    await expect(canvas.getByLabelText(/^Confirm password/, { selector: 'input' })).toHaveAttribute('autocomplete', 'new-password');
    const rules = canvas.getByRole('list', { name: 'Your password needs:' });
    await expect(within(rules).getByText('At least 12 characters').parentElement).toHaveTextContent('not met yet');
    await userEvent.type(password, 'compost');
    const status = canvasElement.querySelector('[role="status"]')!;
    await expect(status).toBeEmptyDOMElement(); // not announced per keystroke
    await userEvent.tab();
    await waitFor(() => expect(status).toHaveTextContent('2 of 4 password rules met'));
    await userEvent.type(password, '-heap-7');
    await waitFor(() => expect(status).toHaveTextContent('All password rules met'));
    await expect(within(rules).getByText('At least 12 characters').parentElement).toHaveTextContent(': met');
    const ids = [...canvasElement.querySelectorAll('[id]')].map((el) => el.id);
    await expect(new Set(ids).size).toBe(ids.length);
  },
};
