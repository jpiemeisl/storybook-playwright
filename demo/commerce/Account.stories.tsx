/*
 * DEMO ONLY: the account area wired to DemoAccountProvider. Actions really change the in-memory account
 * and show Toasts. Interaction stories: play functions and accessibility checks run in the visual suite,
 * without screenshots.
 */
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ToastRegion } from '../../src/components/Toast';
import { AccountAddressesTemplate, AccountDownloadsTemplate, AccountSubscriptionTemplate, AccountWishlistTemplate, AuthTemplate, type CommerceContext } from '../../src/commerce';
import { addressesPage, authPage, chrome, downloadsPage, subscriptionPage, wishlistPage, wishlistProducts, type accountData } from '../../src/commerce/fixtures';
import { DemoAccountProvider, useDemoAccount } from './DemoAccountProvider';

const withAccount: Decorator = (Story, { parameters, id }) => {
  const data = (parameters.demoAccount as { data?: keyof typeof accountData } | undefined)?.data ?? 'everySubscription';
  const fail = !!(parameters.demo as { failAction?: boolean } | undefined)?.failAction;
  return (
    <DemoAccountProvider key={id} data={data} failAction={fail}>
      <Story />
    </DemoAccountProvider>
  );
};

function Toasts() {
  const { toasts, dismissToast } = useDemoAccount();
  return <ToastRegion toasts={toasts} onDismiss={dismissToast} />;
}

/** Callbacks shared by every demo page. */
function useCtx(path: string): CommerceContext {
  const account = useDemoAccount();
  return {
    currentPath: path,
    onSubscriptionAction: (id, request) => account.perform({ type: 'subscription', id, request }),
    onSaveAddress: (address) => account.perform({ type: 'saveAddress', address }),
    onDeleteAddress: (id) => account.perform({ type: 'deleteAddress', id }),
    onSetDefaultAddress: (id, kind) => account.perform({ type: 'setDefaultAddress', id, kind }),
    onRemoveWishlistItem: (productId) => account.perform({ type: 'removeWishlistItem', productId }),
  };
}

function SubscriptionDemo({ id }: { id: string }) {
  const account = useDemoAccount();
  const ctx = useCtx(`/account/subscriptions/${id}`);
  const sub = account.subscriptions.find((s) => s.id === id)!;
  const base = subscriptionPage('active');
  const error = account.lastError?.scope === id ? account.lastError.message : undefined;
  return (
    <>
      <AccountSubscriptionTemplate page={{ ...base, subscription: sub, invoices: account.invoices.filter((i) => i.subscriptionId === id), status: error ? 'error' : 'idle', errorMessage: error }} chrome={chrome} ctx={ctx} />
      <Toasts />
    </>
  );
}

function AddressesDemo() {
  const account = useDemoAccount();
  const error = account.lastError?.scope === 'addresses' ? account.lastError.message : undefined;
  return (
    <>
      <AccountAddressesTemplate page={{ ...addressesPage('three'), addresses: account.addresses, status: error ? 'error' : 'idle', errorMessage: error }} chrome={chrome} ctx={useCtx('/account/addresses')} />
      <Toasts />
    </>
  );
}

function WishlistDemo() {
  const account = useDemoAccount();
  return (
    <>
      <AccountWishlistTemplate page={{ ...wishlistPage('three'), items: account.wishlist, products: wishlistProducts }} chrome={chrome} ctx={useCtx('/account/wishlist')} />
      <Toasts />
    </>
  );
}

function LoginDemo() {
  const [status, setStatus] = useState<'idle' | 'error'>('idle');
  return <AuthTemplate page={{ ...authPage('login'), status }} chrome={chrome} ctx={{ onLogin: () => setStatus('error') }} />;
}

const meta = { title: 'Demo/Account', decorators: [withAccount], parameters: { layout: 'fullscreen', vrt: { screenshot: false } } } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = (el: HTMLElement) => within(el.ownerDocument.body);
const dialog = async (el: HTMLElement) => within(await body(el).findByRole('dialog'));
const status = (el: HTMLElement) => within(el).getByRole('region', { name: 'Notifications' });

/** Pause for two months: the resume date shows in the dialog and on the card, and a Toast confirms. */
export const PauseSubscription: Story = {
  render: () => <SubscriptionDemo id="sub-a1" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Pause' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('radio', { name: '2 months' }));
    await expect(d.getByRole('radio', { name: '2 months' })).toHaveAccessibleDescription('Resumes on May 21, 2026');
    await userEvent.click(d.getByRole('button', { name: 'Pause subscription' }));
    await waitFor(() => expect(within(canvasElement).getAllByText('Paused until May 21, 2026').length).toBeGreaterThan(0));
    await expect(status(canvasElement)).toHaveTextContent('Seasonal seed box is paused until May 21, 2026.');
  },
};

/** Change plan: the summary (next billing date, the host's rule here) appears before confirming; the change is then scheduled. */
export const ChangePlan: Story = {
  render: () => <SubscriptionDemo id="sub-a2" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Change plan' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('radio', { name: /^Monthly Plus/ }));
    await expect(d.getByRole('status')).toHaveTextContent('Upgrade. Your plan changes to Monthly Plus ($28.00 / month) on Apr 15, 2026. You keep Monthly until then.');
    await userEvent.click(d.getByRole('button', { name: 'Change plan' }));
    await waitFor(() => expect(within(canvasElement).getByText(/Switches to Monthly Plus on Apr 15, 2026/)).toBeVisible());
    await expect(within(canvasElement).getByText('Monthly plan')).toBeVisible(); // current plan kept until then
  },
};

/** Cancel with a reason: "Cancels on <date>" and a Toast; then undo it. */
export const CancelThenUndo: Story = {
  render: () => <SubscriptionDemo id="sub-a2" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel subscription' }));
    let d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('radio', { name: 'It costs too much' }));
    await userEvent.click(d.getByRole('button', { name: 'Cancel subscription' }));
    await waitFor(() => expect(canvas.getAllByText('Cancels on Apr 15, 2026').length).toBeGreaterThan(0));
    await expect(status(canvasElement)).toHaveTextContent('Grower club membership cancels on Apr 15, 2026.');
    await userEvent.click(canvas.getByRole('button', { name: 'Keep my subscription' }));
    d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('button', { name: 'Keep my subscription' }));
    await waitFor(() => expect(canvas.getAllByText('Renews on Apr 15, 2026').length).toBeGreaterThan(0));
  },
};

/** Reactivate a cancelled subscription. */
export const Reactivate: Story = {
  render: () => <SubscriptionDemo id="sub-a8" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Reactivate' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('button', { name: 'Reactivate' }));
    await waitFor(() => expect(within(canvasElement).getAllByText('Renews on Mar 21, 2027').length).toBeGreaterThan(0));
  },
};

/** demo.failAction: the cancel dialog stays open with the error; nothing changes. */
export const ActionFails: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demo: { failAction: true } },
  render: () => <SubscriptionDemo id="sub-a1" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Cancel subscription' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('button', { name: 'Cancel subscription' }));
    await waitFor(() => expect(d.getByText(/the server didn’t respond/)).toBeVisible());
    await expect(within(canvasElement).getAllByText('Renews on Apr 1, 2026').length).toBeGreaterThan(0);
  },
};

/** Make an address the default (the badge moves) and delete one with confirmation. */
export const AddressDefaultsAndDelete: Story = {
  render: () => <AddressesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Make default for billing: Parents' }));
    await waitFor(() => expect(canvas.getByRole('heading', { name: 'Parents' }).closest('li')).toHaveTextContent('Default billing'));
    await expect(canvas.getByRole('heading', { name: 'Home' }).closest('li')).not.toHaveTextContent('Default billing');
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Studio' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('button', { name: 'Delete address' }));
    await waitFor(() => expect(canvas.queryByRole('heading', { name: 'Studio' })).toBeNull());
    await expect(status(canvasElement)).toHaveTextContent('Deleted Studio.');
  },
};

/** demo.failAction with page.status: the delete dialog stays open with the error and the address stays. */
export const AddressDeleteFails: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demo: { failAction: true } },
  render: () => <AddressesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Studio' }));
    const d = await dialog(canvasElement);
    await userEvent.click(d.getByRole('button', { name: 'Delete address' }));
    await waitFor(() => expect(d.getByText(/the address couldn’t be deleted/)).toBeVisible());
    await expect(d.getByRole('button', { name: 'Delete address' })).toBeVisible();
    await expect(canvas.getByText('Studio', { selector: 'h2' })).toBeInTheDocument();
  },
};

/** Remove a wishlist item. */
export const RemoveWishlistItem: Story = {
  render: () => <WishlistDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Waxed canvas tote from wishlist' }));
    await waitFor(() => expect(canvas.queryByRole('heading', { name: 'Waxed canvas tote' })).toBeNull());
    await expect(status(canvasElement)).toHaveTextContent('Removed from your wishlist.');
  },
};

/** Reveal and copy a license key in the downloads library. */
export const RevealAndCopyLicenceKey: Story = {
  render: () => <AccountDownloadsTemplate page={downloadsPage('six')} chrome={chrome} ctx={{ currentPath: '/account/downloads' }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const article = canvas.getByRole('heading', { name: 'Garden design template bundle' }).closest('article')!;
    const a = within(article);
    await expect(article).not.toHaveTextContent('GDTB-7Q4M');
    await userEvent.click(a.getByRole('button', { name: 'Show key' }));
    await expect(a.getByText('GDTB-7Q4M-K2XP-9VNA')).toBeVisible();
    await userEvent.click(a.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(a.getByRole('status')).toHaveTextContent(/copied|copy it/i));
  },
};

/** Failed sign-in: a generic error that does not reveal whether the account exists, focused. */
export const FailedLogin: Story = {
  render: () => <LoginDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: /^Email/ }), 'someone@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/, { selector: 'input' }), 'not-the-password-1');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    const alert = await canvas.findByText(/The email or password is incorrect/);
    await waitFor(() => expect(alert.closest('[role="alert"]')).toHaveFocus());
    await expect(canvasElement).not.toHaveTextContent(/no account|not registered|not found/i);
  },
};

/** The register page's password checklist updates as you type. */
export const PasswordChecklist: Story = {
  render: () => <AuthTemplate page={authPage('register')} chrome={chrome} ctx={{ onRegister: () => undefined }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rules = canvas.getByRole('list', { name: 'Your password needs:' });
    await userEvent.type(canvas.getByLabelText(/^Password/, { selector: 'input' }), 'compost-heap-7');
    await expect(within(rules).getAllByText(/: met$/)).toHaveLength(4);
    await waitFor(() => expect(canvasElement.querySelector('[role="status"]')).toHaveTextContent('All password rules met'));
  },
};
