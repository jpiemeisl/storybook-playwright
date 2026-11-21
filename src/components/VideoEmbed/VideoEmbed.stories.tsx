import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { selfHostedVideo, videos } from '../../fixtures/content';
import { withIframeSrcCaptured } from '../../stories/embedTestUtils';
import { Video, VideoEmbed } from './VideoEmbed';

const meta = {
  title: 'Media/VideoEmbed',
  component: VideoEmbed,
  tags: ['vrt-mobile'],
  args: videos.youtube,
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <VideoEmbed {...args} />
    </div>
  ),
} satisfies Meta<typeof VideoEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pre-activation: a local poster and a play button. No iframe exists yet. */
export const YouTube: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    await expect(within(canvasElement).getByText('Opens content from YouTube.')).toBeInTheDocument();
  },
};

export const Vimeo: Story = {
  args: videos.vimeo,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).toBeNull();
  },
};

export const GenericWithoutPoster: Story = {
  args: videos.generic,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).toBeNull();
  },
};

export const Square: Story = {
  args: { aspectRatio: '1 / 1' },
  render: (args) => (
    <div style={{ maxInlineSize: '24rem' }}>
      <VideoEmbed {...args} />
    </div>
  ),
};

/**
 * Activation: the iframe is created on click, on the privacy-enhanced host. The iframe's src is
 * captured before the browser can load it (see embedTestUtils), so nothing third-party is fetched;
 * this story is never screenshotted.
 */
export const ActivationCreatesIframe: Story = {
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    const { intended } = await withIframeSrcCaptured(async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Play video: How a five-day close works' }));
      await waitFor(() => expect(canvasElement.querySelector('iframe')).not.toBeNull());
    });
    const iframe = canvasElement.querySelector('iframe')!;
    const src = new URL(intended[0]!);
    await expect(src.host).toBe('www.youtube-nocookie.com');
    await expect(src.pathname).toBe('/embed/bS2kLx9QpE4');
    await expect(iframe).toHaveAttribute('title', 'How a five-day close works');
    await expect(iframe).toHaveAttribute('loading', 'lazy');
    await expect(iframe).not.toHaveAttribute('src');
  },
};

export const VimeoActivationUsesDnt: Story = {
  args: videos.vimeo,
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const { intended } = await withIframeSrcCaptured(async () => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: /^Play video/ }));
      await waitFor(() => expect(canvasElement.querySelector('iframe')).not.toBeNull());
    });
    const src = new URL(intended[0]!);
    await expect(src.host).toBe('player.vimeo.com');
    await expect(src.searchParams.get('dnt')).toBe('1');
  },
};

/** Self-hosted file: native controls, local poster, captions track, preload="none". */
export const SelfHosted: Story = {
  render: () => (
    <div style={{ maxInlineSize: '48rem' }}>
      <Video {...selfHostedVideo} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const video = canvasElement.querySelector('video')!;
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video.querySelector('track')).toHaveAttribute('kind', 'captions');
  },
};
