import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Landing',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'landing' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    // Minimal chrome: no main navigation and no footer link columns.
    await expect(within(canvasElement).queryByRole('navigation', { name: 'Main' })).toBeNull();
    await expect(canvasElement.querySelector('footer nav')).toBeNull();
  },
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Landing: Story = { tags: ['!vrt-mobile', 'vrt-full'] };

/** Below 48rem a call to action stays at the bottom of the screen; the page reserves scroll padding for it. */
export const WithStickyCta: Story = {
  args: { name: 'landing-with-sticky-cta' },
  play: async (context) => {
    await meta.play(context);
    const cta = within(context.canvasElement).getByRole('link', { name: 'Book a payroll demo', hidden: true });
    const html = context.canvasElement.ownerDocument.documentElement;
    if (cta.checkVisibility()) {
      await expect(parseFloat(getComputedStyle(html).scrollPaddingBottom)).toBeGreaterThan(cta.getBoundingClientRect().height);
    } else {
      await expect(getComputedStyle(html).scrollPaddingBottom).toMatch(/^(0px|auto)$/);
    }
  },
};
