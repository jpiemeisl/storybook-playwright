import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  headerCta,
  longNav,
  mainNav,
  mainNavWithCurrent,
  mainNavWithCurrentTop,
  shortNav,
} from '../../fixtures/navigation';
import { Logo } from '../../stories/Logo';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Header } from './Header';

/** Page content under the header, so dropdown overlap and sticky behavior are visible. */
const withPage: Decorator = (Story, { parameters }) => (
  <>
    <Story />
    <Section padding="md">
      <Container size="xl">
        <Stack gap="md">
          <Heading as="h1" size="3xl">
            Accessible products, shipped faster
          </Heading>
          <Text tone="muted" style={{ maxInlineSize: '40rem' }}>
            We help product teams build design systems that are accessible by default, documented where developers
            work and tested on every change.
          </Text>
          {parameters.longPage &&
            Array.from({ length: 30 }, (_, i) => (
              <Text key={i}>Paragraph {i + 1}. Scroll content to show the header staying at the top of the viewport.</Text>
            ))}
        </Stack>
      </Container>
    </Section>
  </>
);

const meta = {
  title: 'Navigation/Header',
  component: Header,
  tags: ['vrt-full'],
  decorators: [withPage],
  parameters: { layout: 'fullscreen' },
  args: { logo: <Logo />, items: mainNav, cta: headerCta, sticky: false },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { tags: ['theme-smoke'] };

export const WithoutCta: Story = {
  args: { cta: undefined },
};

export const ShortNav: Story = {
  args: { items: shortNav, cta: undefined },
};

/**
 * 10 long items never fit inline: the header measures this and switches to the menu button at every
 * width, rather than wrapping or clipping items.
 */
export const LongNav: Story = {
  args: { items: longNav },
};

/** A top-level page is current: aria-current="page" and an underline indicator. */
export const ActiveItem: Story = {
  args: { items: mainNavWithCurrentTop },
};

/** A child page is current: its parent toggle shows the active indicator. */
export const ActiveChild: Story = {
  args: { items: mainNavWithCurrent },
};

/** Scrolled 600px: the sticky header stays pinned over the content. */
export const Sticky: Story = {
  args: { sticky: true },
  parameters: { longPage: true, vrt: { viewports: [375, 768, 1280] } },
  play: async () => {
    window.scrollTo(0, 600);
    await waitFor(() => expect(window.scrollY).toBe(600));
  },
};

/**
 * Keyboard: Enter opens the dropdown, ArrowDown moves into it, Escape closes it and returns focus,
 * Space opens it again (final state is captured).
 */
export const DropdownOpen: Story = { tags: ['theme-smoke'],
  parameters: { vrt: { viewports: [{ width: 1280, fullPage: true }] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Services' });
    toggle.focus();

    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('link', { name: 'Services overview' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveFocus();

    await userEvent.keyboard(' ');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Menu button opens the drawer (mobile viewport). */
export const MobileMenuOpen: Story = {
  parameters: { vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
    const dialog = canvas.getByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
  },
};

/** Keyboard: Enter opens the menu with focus inside; Escape closes it and focus returns to the menu button. */
export const MobileMenuKeyboard: Story = {
  parameters: { vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menuButton = canvas.getByRole('button', { name: 'Menu' });
    menuButton.focus();

    await userEvent.keyboard('{Enter}');
    const dialog = canvas.getByRole('dialog', { hidden: true });
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.contains(document.activeElement)).toBe(true);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveFocus();
  },
};

/**
 * Items that arrive after the first render (for example from a host app's async navigation) are still
 * measured: the long nav collapses to the menu button.
 */
export const ItemsArriveLater: Story = {
  parameters: { vrt: { screenshot: false } },
  args: { items: [] },
  render: function Render(args) {
    const [items, setItems] = useState(args.items);
    return (
      <>
        <Header {...args} items={items} />
        <button type="button" onClick={() => setItems(longNav)}>
          Load navigation
        </button>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvasElement.querySelector('header')!;
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(header).not.toHaveAttribute('data-overflowing');
    await userEvent.click(canvas.getByRole('button', { name: 'Load navigation' }));
    await waitFor(() => expect(header).toHaveAttribute('data-overflowing'));
    await expect(canvas.getByRole('button', { name: 'Menu' })).toBeVisible();
  },
};
