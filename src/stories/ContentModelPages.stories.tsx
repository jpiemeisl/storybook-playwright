import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { BlockRenderer } from '../registry';
import { expectHeadingOutline, fixturePage, SiteFrame } from './contentModel';

/**
 * Every page fixture in `src/fixtures/pages/*.json`, rendered by `BlockRenderer` inside a site frame.
 * The JSON is exactly what a CMS adapter would produce; nothing here is hand-assembled.
 */
const meta = {
  title: 'Content model/Pages',
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  args: { name: 'home' },
  render: ({ name }) => (
    <SiteFrame>
      <BlockRenderer blocks={fixturePage(name).blocks} />
    </SiteFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement.querySelector('main')!);
  },
} satisfies Meta<{ name: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { args: { name: 'home' }, tags: ['!vrt-mobile', 'vrt-full'] };
export const About: Story = {
  args: { name: 'about' },
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector('main')!;
    await expectHeadingOutline(main);
    // anchorId on the team block becomes the section's element id.
    const team = main.querySelector('#team');
    await expect(team?.tagName).toBe('SECTION');
    await expect(team?.getAttribute('data-block-type')).toBe('team');
  },
};
export const Services: Story = { args: { name: 'services' } };
export const ServiceDetail: Story = {
  args: { name: 'service-detail' },
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector('main')!;
    await expectHeadingOutline(main);
    await expect(main.querySelector('#questions')?.getAttribute('data-block-type')).toBe('faq');
  },
};
export const Pricing: Story = {
  args: { name: 'pricing' },
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector('main')!;
    await expectHeadingOutline(main);
    await expect(main.querySelector('#plans')?.getAttribute('data-block-type')).toBe('pricingTable');
  },
};
export const Contact: Story = { args: { name: 'contact' }, tags: ['!vrt-mobile', 'vrt-full'] };
export const BlogIndex: Story = { args: { name: 'blog-index' } };
export const BlogPost: Story = { args: { name: 'blog-post' }, tags: ['!vrt-mobile', 'vrt-full'] };
export const CaseStudy: Story = { args: { name: 'case-study' } };
export const Landing: Story = { args: { name: 'landing' } };
export const Legal: Story = { args: { name: 'legal' } };
export const NotFound: Story = { args: { name: 'not-found' } };
