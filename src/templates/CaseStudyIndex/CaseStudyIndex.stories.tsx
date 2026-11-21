import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Case study index',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'case-study-index' },
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nine case studies, industry filters, page 1 of 2. */
export const CaseStudyIndex: Story = {
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).getByRole('link', { name: /All industries/ })).toHaveAttribute('aria-current', 'page');
  },
};
