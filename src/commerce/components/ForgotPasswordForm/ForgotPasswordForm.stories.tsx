import type { Meta, StoryObj } from '@storybook/react-vite';
import layout from '../../stories/storyLayout.module.css';
import { ResetPasswordForm } from '../ResetPasswordForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const meta = { title: 'Commerce/Account/ForgotAndResetPassword', component: ForgotPasswordForm, tags: ['vrt-mobile'] } satisfies Meta<typeof ForgotPasswordForm>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const grid = { display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(22rem, 100%), 1fr))', alignItems: 'start' } as const;

/** Forgot password (idle, neutral success) and reset password (idle, success, expired link). */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={grid}>
      <section aria-label="Forgot: idle">
        <p className={layout.label}>Forgot password: idle</p>
        <ForgotPasswordForm links={{ signIn: '/account/login' }} />
      </section>
      <section aria-label="Forgot: success">
        <p className={layout.label}>Forgot password: success (neutral)</p>
        <ForgotPasswordForm status="success" email="robin@example.com" links={{ signIn: '/account/login' }} />
      </section>
      <section aria-label="Reset: idle">
        <p className={layout.label}>Reset password: idle</p>
        <ResetPasswordForm hiddenFields={<input type="hidden" name="token" value="demo" />} links={{ signIn: '/account/login' }} />
      </section>
      <section aria-label="Reset: success">
        <p className={layout.label}>Reset password: success</p>
        <ResetPasswordForm status="success" />
      </section>
      <section aria-label="Reset: expired">
        <p className={layout.label}>Reset password: expired link</p>
        <ResetPasswordForm expired />
      </section>
    </div>
  ),
};
