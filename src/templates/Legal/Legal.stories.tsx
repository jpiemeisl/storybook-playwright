import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Legal',
  tags: ['vrt-full'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'legal' },
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Twelve sections with a sticky TOC. The print stylesheet has its own visual test (tests/visual/print.spec.ts). */
export const Legal: Story = {
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).getByText('Last updated', { exact: false })).toBeVisible();
  },
};
