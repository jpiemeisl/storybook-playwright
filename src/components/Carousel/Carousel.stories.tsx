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

/** Start: Previous is disabled; every slide is labeled "Slide n of 6". */
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

/**
 * Right-to-left: the track starts on the right (scrollLeft runs negative), Next moves toward the left,
 * and the buttons, dots and ends still track the position.
 */
export const RightToLeft: Story = {
  parameters: { vrt: { screenshot: false } },
  render: (args) => (
    <div dir="rtl">
      <Carousel {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole('button', { name: 'Previous slide' });
    const next = canvas.getByRole('button', { name: 'Next slide' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute('aria-current', 'true');
    await userEvent.click(next);
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current', 'true'), {
      timeout: 3000,
    });
    await expect(previous).not.toHaveAttribute('aria-disabled');
    await userEvent.click(canvas.getByRole('button', { name: 'Go to slide 6' }));
    await waitFor(() => expect(next).toHaveAttribute('aria-disabled', 'true'), { timeout: 3000 });
    await userEvent.click(previous);
    await waitFor(() => expect(next).not.toHaveAttribute('aria-disabled'), { timeout: 3000 });
  },
};
