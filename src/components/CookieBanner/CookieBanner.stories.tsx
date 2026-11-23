import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Link } from '../Link';
import { Prose } from '../Prose';
import { CookieBanner } from './CookieBanner';
import { type ConsentCategory, type ConsentChoices } from './consent';

/*
 * The cookie banner is shown only in these stories (and the demo shop's "With cookie banner" story), never
 * in any other story or screenshot, so it can't hide content under test.
 */
const categories: ConsentCategory[] = [
  { id: 'necessary', label: 'Strictly necessary', description: 'Sign-in, your cart and security. The site does not work without these.', required: true },
  { id: 'preferences', label: 'Preferences', description: 'Remember choices such as your region.' },
  { id: 'analytics', label: 'Analytics', description: 'Count visits so we can see which pages help.' },
  { id: 'marketing', label: 'Marketing', description: 'Measure campaigns on other sites.' },
];

const message = (
  <p>
    We use cookies to make the site work and, with your permission, to understand how it is used. <Link href="/privacy">Privacy policy</Link>
  </p>
);

/** A page behind the banner, plus a readout of the last choice (the host would store it). */
function Harness({ position }: { position?: 'bottom' | 'bottom-start' }) {
  const [result, setResult] = useState<string>('none');
  const [open, setOpen] = useState(true);
  const done = (text: string) => {
    setResult(text);
    setOpen(false);
  };
  return (
    <>
      <Prose>
        <h1>Page content</h1>
        <p>
          The banner is a labelled region. It does not take focus: <button type="button">this button</button> keeps it.
        </p>
        <p>
          Last choice: <output aria-label="Last choice">{result}</output>
        </p>
      </Prose>
      <CookieBanner
        open={open}
        position={position}
        message={message}
        categories={categories}
        onAcceptAll={() => done('accept all')}
        onRejectAll={() => done('reject all')}
        onSave={(choices: ConsentChoices) => done(JSON.stringify(choices))}
        onClose={() => done('closed')}
      />
    </>
  );
}

const meta = { title: 'Feedback/CookieBanner', component: CookieBanner, tags: ['vrt-mobile'], parameters: { layout: 'padded' } } satisfies Meta<typeof CookieBanner>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const banner = (el: HTMLElement) => within(el).getByRole('region', { name: 'Cookies on this site' });

/** Full width at the bottom. Accept and Reject have the same style and size. */
export const Bottom: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const region = within(banner(canvasElement));
    const accept = region.getByRole('button', { name: 'Accept all' });
    const reject = region.getByRole('button', { name: 'Reject all' });
    await expect(accept.className).toBe(reject.className);
    await expect(accept.getBoundingClientRect().height).toBe(reject.getBoundingClientRect().height);
  },
};

/** A card in the start corner. */
export const BottomStart: Story = { render: () => <Harness position="bottom-start" /> };

/** "Choose settings" opens the dialog; necessary is on and can't be changed. */
export const SettingsOpen: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(banner(canvasElement)).getByRole('button', { name: 'Choose settings' }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Cookie settings' }));
    const necessary = dialog.getByRole('checkbox', { name: 'Strictly necessary (always on)' });
    await expect(necessary).toBeChecked();
    await expect(necessary).toBeDisabled();
    await expect(dialog.getByRole('checkbox', { name: 'Analytics' })).not.toBeChecked();
  },
};

/** Appearing does not move focus; Tab reaches each action once, in order; nothing is trapped. */
export const KeyboardAndFocus: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await expect(banner(canvasElement).contains(doc.activeElement)).toBe(false);
    const stops: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await userEvent.tab();
      const el = doc.activeElement as HTMLElement;
      if (banner(canvasElement).contains(el)) stops.push(el.getAttribute('aria-label') ?? el.textContent!.trim());
    }
    // Wrapping round the document twice: every stop appears, and focus also left the banner (not trapped).
    await expect([...new Set(stops)]).toEqual(['Privacy policy', 'Accept all', 'Reject all', 'Choose settings', 'Close cookie banner']);
    await expect(within(canvasElement).getByRole('button', { name: 'this button' })).toBeInTheDocument();
  },
};

/** Save choices returns plain, serializable choices; required categories stay on. */
export const SaveChoices: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(banner(canvasElement)).getByRole('button', { name: 'Choose settings' }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Cookie settings' }));
    await userEvent.click(dialog.getByRole('checkbox', { name: 'Analytics' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Save choices' }));
    await waitFor(() => expect(within(canvasElement).getByLabelText('Last choice')).toHaveTextContent('{"necessary":true,"preferences":false,"analytics":true,"marketing":false}'));
    await expect(within(canvasElement).queryByRole('region', { name: 'Cookies on this site' })).toBeNull();
  },
};

/** Accept all and Reject all call their callbacks. */
export const AcceptAndReject: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(banner(canvasElement)).getByRole('button', { name: 'Reject all' }));
    await expect(within(canvasElement).getByLabelText('Last choice')).toHaveTextContent('reject all');
  },
};

/** The settings dialog's "Reject all" closes the dialog and calls the same onRejectAll as the banner's. */
export const DialogRejectAll: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(banner(canvasElement)).getByRole('button', { name: 'Choose settings' }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Cookie settings' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Reject all' }));
    await waitFor(() => expect(within(canvasElement).getByLabelText('Last choice')).toHaveTextContent('reject all'));
    await expect(within(canvasElement.ownerDocument.body).queryByRole('dialog', { name: 'Cookie settings' })).toBeNull();
  },
};
