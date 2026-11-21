import type { Meta, StoryObj } from '@storybook/react-vite';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Thank you',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'thank-you' },
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThankYou: Story = { play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args) };
