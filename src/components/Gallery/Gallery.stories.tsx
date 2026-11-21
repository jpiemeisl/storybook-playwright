import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { galleryOne, galleryThree, galleryTwelve } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { Gallery } from './Gallery';

const meta = {
  title: 'Media/Gallery',
  component: Gallery,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { images: galleryTwelve, layout: 'grid', columns: 4 },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const Columns: Story = {
  args: { layout: 'columns', columns: 3 },
};

export const ThreeImages: Story = {
  args: { images: galleryThree, columns: 3 },
};

export const OneImage: Story = {
  args: { images: galleryOne, columns: 3 },
};

/** lightbox={false}: plain images, no buttons. */
export const WithoutLightbox: Story = {
  args: { images: galleryThree, columns: 3, lightbox: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
  },
};

async function openAt(canvasElement: HTMLElement, alt: string) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: alt }));
  const dialog = within(canvasElement).getByRole('dialog', { hidden: true });
  await waitFor(() => expect(dialog).toHaveAttribute('open'));
  return within(dialog);
}

/* A modal belongs in a viewport-sized screenshot, not a full-page one. */
const viewportOnly = { vrt: { viewports: [375, 768, 1280] } };

export const LightboxFirst: Story = {
  parameters: viewportOnly,
  play: async ({ canvasElement }) => {
    const dialog = await openAt(canvasElement, galleryTwelve[0]!.alt);
    await expect(dialog.getByText('1 of 12')).toBeInTheDocument();
    await expect(dialog.getByRole('button', { name: 'Previous image' })).toHaveAttribute('aria-disabled', 'true');
  },
};

/** Keyboard: ArrowRight/ArrowLeft move through images and the counter follows. */
export const LightboxMiddle: Story = {
  parameters: viewportOnly,
  play: async ({ canvasElement }) => {
    const dialog = await openAt(canvasElement, galleryTwelve[5]!.alt);
    await expect(dialog.getByText('6 of 12')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}');
    await expect(dialog.getByText('7 of 12')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(dialog.getByText('5 of 12')).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Next image' }));
    await expect(dialog.getByText('6 of 12')).toBeInTheDocument();
  },
};

export const LightboxLast: Story = {
  parameters: viewportOnly,
  play: async ({ canvasElement }) => {
    const dialog = await openAt(canvasElement, galleryTwelve[11]!.alt);
    await expect(dialog.getByText('12 of 12')).toBeInTheDocument();
    await expect(dialog.getByRole('button', { name: 'Next image' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(dialog.getByText('12 of 12')).toBeInTheDocument();
  },
};

/** One image: no counter or arrows. Escape closes and returns focus to the thumbnail. */
export const LightboxSingleImage: Story = {
  parameters: viewportOnly,
  args: { images: galleryOne, columns: 3 },
  play: async ({ canvasElement }) => {
    const dialog = await openAt(canvasElement, galleryOne[0]!.alt);
    await expect(dialog.queryByRole('button', { name: 'Next image' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(canvasElement).getByRole('button', { name: galleryOne[0]!.alt })).toHaveFocus());
  },
};
