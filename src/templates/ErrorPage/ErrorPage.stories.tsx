import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Error page',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'error-404' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full chrome, actions, search (GET) and suggested pages. */
export const NotFound: Story = {
  args: { name: 'error-404' },
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).getByRole('search')).toHaveAttribute('method', 'get');
  },
};

/** Minimal chrome: logo-only header, legal-only footer. */
export const ServerError: Story = {
  args: { name: 'error-500' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).queryByRole('navigation', { name: 'Main' })).toBeNull();
  },
};

export const Unavailable: Story = { args: { name: 'error-503' } };
