import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectCurrentNav, expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

/**
 * Composed templates: one DefaultTemplate, registered as home, about, services, service-detail,
 * pricing and contact. The page fixtures (blocks) make the difference.
 */
const meta = {
  title: 'Templates/Composed pages',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'home' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const full = ['!vrt-mobile', 'vrt-full'];

export const Home: Story = { args: { name: 'home' }, tags: full };
export const About: Story = {
  args: { name: 'about' },
  tags: full,
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expectCurrentNav(canvasElement, 'About');
  },
};
export const Services: Story = { args: { name: 'services' } };
export const ServiceDetail: Story = { args: { name: 'service-detail' } };
export const Pricing: Story = { args: { name: 'pricing' }, tags: full };
export const Contact: Story = { args: { name: 'contact' }, tags: full };

/** Desktop: the Services dropdown open over the hero. */
export const HeaderDropdownOpen: Story = {
  args: { name: 'home' },
  parameters: { layout: 'fullscreen', vrt: { viewports: [1280] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Services' });
    if (!toggle.checkVisibility()) return; // narrow viewport: the menu button replaces the inline nav
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(within(toggle.closest('li')!).getByRole('link', { name: 'Payroll' })).toBeVisible();
  },
};

/** Mobile: the menu drawer open. */
export const MobileMenuOpen: Story = {
  args: { name: 'home' },
  parameters: { layout: 'fullscreen', vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Menu' });
    if (!button.checkVisibility()) return; // wide viewport: inline nav instead
    await userEvent.click(button);
    await waitFor(() => expect(within(document.body).getByRole('dialog', { name: 'Menu' })).toBeVisible());
  },
};

/** The announcement dismissed (in memory only): the bar is gone and focus continues at <main>. */
export const AnnouncementDismissed: Story = {
  args: { name: 'home' },
  parameters: { layout: 'fullscreen', vrt: { viewports: [1280] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss announcement' }));
    await expect(canvas.queryByRole('region', { name: 'Announcement' })).toBeNull();
    await expect(document.activeElement?.id).toBe('main');
    (document.activeElement as HTMLElement).blur();
    window.scrollTo(0, 0);
  },
};
