import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { authPage, chrome } from '../../fixtures';
import { expectHeadingOutline } from '../../stories/browseStories';
import type { AuthPage, AuthTemplateName } from '../../types/account-pages';
import { AuthTemplate } from './AuthTemplate';

type Args = { template: AuthTemplateName; extra?: Partial<AuthPage> };

const meta = {
  title: 'Commerce/Templates/Auth',
  parameters: { layout: 'fullscreen' },
  args: { template: 'login' },
  render: ({ template, extra }: Args) => <AuthTemplate page={authPage(template, extra)} chrome={chrome} ctx={{ formHiddenFields: <input type="hidden" name="csrf" value="demo-token" /> }} />,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const mobile = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };
const submitEmpty = (label: string): Story['play'] => async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: label }));
  await waitFor(() => expect(within(canvasElement).getByRole('alert')).toHaveFocus());
  await expectHeadingOutline(canvasElement);
};

/** Sign in on the minimal layout; the CSRF token from ctx is in the form. */
export const Login: Story = {
  tags: ['vrt-full', 'theme-smoke'],
  parameters: { layout: 'fullscreen' },
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    await expect(canvasElement.querySelector('form input[name="csrf"]')).toHaveValue('demo-token');
  },
};
export const LoginErrors: Story = { tags: ['vrt-mobile'], parameters: mobile, play: submitEmpty('Sign in') };
export const Register: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'register' } };
export const RegisterErrors: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'register' }, play: submitEmpty('Create account') };
export const ForgotPassword: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'forgot-password' } };
export const ForgotPasswordSent: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'forgot-password', extra: { status: 'success', email: 'robin@example.com' } } };
export const ResetPassword: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'reset-password' } };
export const ResetPasswordExpired: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { template: 'reset-password', extra: { expired: true } } };

/** ctx.socialSlot goes above the sign-in fields; links default under page.links.account. Behavior only. */
export const LoginWithSocialSlot: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  render: () => (
    <AuthTemplate
      page={authPage('login', { links: { account: '/my-account' } })}
      chrome={chrome}
      ctx={{
        socialSlot: (
          <button type="button" onClick={() => undefined}>
            Continue with a single sign-on provider
          </button>
        ),
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Continue with a single sign-on provider' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: /Forgot/ })).toHaveAttribute('href', '/my-account/forgot-password');
  },
};
