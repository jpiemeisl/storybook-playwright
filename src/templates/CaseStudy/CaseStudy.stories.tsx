import type { Meta, StoryObj } from '@storybook/react-vite';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Case study',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'case-study' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaseStudy: Story = { tags: ['!vrt-mobile', 'vrt-full'] };

/** Client and body only: no facts beyond the client, image, results or previous/next links. */
export const Minimal: Story = { args: { name: 'case-study-minimal' } };
