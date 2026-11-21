import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { galleryTwelve, relatedArticles } from '../../fixtures/content';
import { cards } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { ArticleCard } from '../ArticleCard';
import { Card } from '../Card';
import { Image } from '../Image';
import { Carousel } from './Carousel';

const slides = cards.slice(0, 6).map((card) => <Card key={card.title} {...card} />);

const meta = {
  title: 'Media/Carousel',
  component: Carousel,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { label: 'Case studies', slidesPerView: 3, showDots: true, children: slides },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Start: Previous is disabled; every slide is labelled "Slide n of 6". */
export const AtStart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Case studies' })).toHaveAttribute('aria-roledescription', 'carousel');
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Next slide' })).not.toHaveAttribute('aria-disabled');
    const groups = canvas.getAllByRole('group');
    await expect(groups).toHaveLength(6);
    await expect(groups[1]).toHaveAccessibleName('Slide 2 of 6');
    await expect(groups[1]).toHaveAttribute('aria-roledescription', 'slide');
  },
};

export const AtMiddle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Go to slide 3' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true'));
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).not.toHaveAttribute('aria-disabled');
  },
};

/** End: Next is disabled (no loop). */
export const AtEnd: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Go to slide 6' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Next slide' })).toHaveAttribute('aria-disabled', 'true'), {
      timeout: 3000,
    });
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).not.toHaveAttribute('aria-disabled');
  },
};

/** loop: neither button is ever disabled. */
export const Loop: Story = {
  args: { loop: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).not.toHaveAttribute('aria-disabled');
  },
};

/** Off-screen slides stay in the tab order (no aria-hidden). */
export const OffscreenLinksReachable: Story = {
  args: { showDots: false, children: relatedArticles.concat(relatedArticles).map((a, i) => <ArticleCard key={i} article={{ ...a, href: `${a.href}-${i}` }} />) },
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole('link');
    await expect(links).toHaveLength(6);
    for (const link of links) await expect(link.closest('[aria-hidden="true"]')).toBeNull();
  },
};

export const OnePerView: Story = {
  args: {
    slidesPerView: 1,
    label: 'Office photos',
    children: galleryTwelve.slice(0, 5).map((image) => <Image key={image.src} {...image} aspectRatio="16 / 9" />),
  },
};

export const ResponsivePerView: Story = {
  args: { slidesPerView: { base: 1, sm: 2, md: 3, lg: 4 }, showDots: false },
};
