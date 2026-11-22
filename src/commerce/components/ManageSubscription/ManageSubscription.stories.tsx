import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { accountSubscriptions, DEMO_NOW, type AccountSubscriptionKey } from '../../fixtures';
import layout from '../../stories/storyLayout.module.css';
import { ManageSubscription } from './ManageSubscription';

type Args = { sub: AccountSubscriptionKey; status?: 'idle' | 'submitting' | 'error' };

function Demo({ sub, status }: Args) {
  return (
    <div style={{ padding: '1rem' }}>
      <ManageSubscription subscription={accountSubscriptions[sub]} now={DEMO_NOW} onAction={() => undefined} status={status} errorMessage="Our payment provider didn’t respond. Nothing has changed." accessNote="Your planner data stays available to export for 30 days." />
    </div>
  );
}

const meta = { title: 'Commerce/Account/ManageSubscription', component: Demo, tags: ['vrt-mobile'], parameters: { layout: 'fullscreen' }, args: { sub: 'withPlans' } } satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The actions available for each status (getSubscriptionActions). */
export const ActionsPerStatus: Story = {
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
      {(Object.keys(accountSubscriptions) as AccountSubscriptionKey[]).map((key) => (
        <section key={key} aria-label={key}>
          <p className={layout.label}>{key}</p>
          <ManageSubscription subscription={accountSubscriptions[key]} now={DEMO_NOW} onAction={() => undefined} />
        </section>
      ))}
    </div>
  ),
};

const openDialog = (label: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: label }));
  await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog')).toBeVisible());
};

export const PauseDialog: Story = { args: { sub: 'active' }, play: openDialog('Pause') };
export const ChangePlanDialog: Story = {
  args: { sub: 'withPlans' },
  play: async (context) => {
    await openDialog('Change plan')(context);
    const dialog = within(within(context.canvasElement.ownerDocument.body).getByRole('dialog'));
    await expect(dialog.getByRole('radio', { name: /Monthly: \$20\.00 \/ month \(Current plan\)/ })).toBeDisabled();
    await userEvent.click(dialog.getByRole('radio', { name: /^Annual/ }));
    await expect(dialog.getByRole('status')).toHaveTextContent('Downgrade. Your plan changes to Annual ($192.00 / year) on Apr 15, 2026. Nothing is charged today.');
  },
};
/** The cancel dialog focuses "Keep subscription" first; Escape closes it and focus returns to the button. */
export const CancelDialog: Story = {
  args: { sub: 'withPlans' },
  play: async (context) => {
    const opener = within(context.canvasElement).getByRole('button', { name: 'Cancel subscription' });
    await openDialog('Cancel subscription')(context);
    const dialog = within(within(context.canvasElement.ownerDocument.body).getByRole('dialog'));
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Keep subscription' })).toHaveFocus());
    await expect(dialog.getByRole('textbox', { name: 'Anything else? (optional)' })).not.toBeRequired();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
    await openDialog('Cancel subscription')(context);
  },
};
export const CancelError: Story = { args: { sub: 'withPlans', status: 'error' }, parameters: { layout: 'fullscreen', vrt: { screenshot: false } }, play: openDialog('Cancel subscription') };
export const ResumeDialog: Story = { args: { sub: 'paused' }, play: openDialog('Resume') };
export const UndoCancelDialog: Story = { args: { sub: 'cancelling' }, play: openDialog('Keep my subscription') };
export const ReactivateDialog: Story = { args: { sub: 'cancelled' }, play: openDialog('Reactivate') };
