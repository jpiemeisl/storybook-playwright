import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { headerCta, mainNav, mainNavWithCurrent } from '../../fixtures/navigation';
import { Button } from '../Button';
import { MobileMenu, type MobileMenuProps } from './MobileMenu';

/* MobileMenu is controlled; this wrapper owns the open state like Header does. */
function MenuDemo(props: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        Open menu
      </Button>
      <MobileMenu {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const meta = {
  title: 'Navigation/MobileMenu',
  component: MobileMenu,
  tags: ['vrt-full'],
  args: { open: false, onClose: () => {}, items: mainNav, cta: headerCta },
  render: (args) => <MenuDemo {...args} />,
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openMenu(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
  const dialog = canvas.getByRole('dialog', { name: 'Menu' });
  await waitFor(() => expect(dialog).toHaveAttribute('open'));
  return within(dialog);
}

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    await expect(menu.getByRole('button', { name: 'Close menu' })).toHaveFocus();
  },
};

/** Accordion section expanded; the current page is highlighted. */
export const OpenWithExpandedSection: Story = {
  args: { items: mainNavWithCurrent },
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    const services = menu.getByRole('button', { name: 'Services' });
    // Starts expanded because it contains the current page; collapse and re-expand to exercise the toggle.
    await expect(services).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(services);
    await expect(services).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(services);
    await expect(services).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('link', { name: 'Design systems' })).toHaveAttribute('aria-current', 'page');
  },
};

/** The close button closes the menu and focus returns to the button that opened it. */
export const CloseReturnsFocus: Story = {
  play: async ({ canvasElement }) => {
    const menu = await openMenu(canvasElement);
    await userEvent.click(menu.getByRole('button', { name: 'Close menu' }));
    const opener = within(canvasElement).getByRole('button', { name: 'Open menu' });
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
