import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureImages, missingImageSrc } from '../../fixtures/images';
import { Grid } from '../Grid';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Image } from './Image';

const { landscape, portrait, square, standard } = fixtureImages;

const meta = {
  title: 'Primitives/Image',
  component: Image,
  tags: ['vrt-full'],
  args: { ...landscape, loading: 'eager' },
  argTypes: {
    fit: { control: 'inline-radio', options: ['cover', 'contain'] },
    loading: { control: 'inline-radio', options: ['lazy', 'eager'] },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

function Caption({ children }: { children: string }) {
  return (
    <Text as="figcaption" size="sm" tone="muted">
      {children}
    </Text>
  );
}

export const Playground: Story = {
  tags: ['skip-vrt'],
};

/** Intrinsic width/height reserve space; the image scales to its container. */
export const Responsive: Story = {};

/** `aspectRatio` crops every source to the same shape, so cards line up regardless of upload size. */
export const FixedRatio: Story = {
  render: (args) => (
    <Grid columns={3}>
      {[landscape, portrait, square].map((img) => (
        <Stack as="figure" gap="xs" key={img.src} style={{ margin: 0 }}>
          <Image {...args} {...img} aspectRatio="4 / 3" />
          <Caption>{`${img.width}×${img.height} source at 4:3`}</Caption>
        </Stack>
      ))}
    </Grid>
  ),
};

export const CoverVersusContain: Story = {
  render: (args) => (
    <Grid columns={2}>
      <Stack as="figure" gap="xs" style={{ margin: 0 }}>
        <Image {...args} {...portrait} aspectRatio="16 / 9" fit="cover" />
        <Caption>fit="cover" fills the box and crops</Caption>
      </Stack>
      <Stack as="figure" gap="xs" style={{ margin: 0 }}>
        <Image {...args} {...portrait} aspectRatio="16 / 9" fit="contain" />
        <Caption>fit="contain" shows the whole image</Caption>
      </Stack>
    </Grid>
  ),
};

/** alt="" marks the image as decorative; assistive tech skips it. */
export const Decorative: Story = {
  args: { ...standard, alt: '', aspectRatio: '21 / 9' },
};

/** A failed load swaps in a neutral placeholder that keeps the reserved space and the alt text. */
export const LoadFailure: Story = {
  render: (args) => (
    <Grid columns={2}>
      <Image {...args} src={missingImageSrc} alt="Team photo from the 2026 offsite" aspectRatio="4 / 3" />
      <Image {...args} src={missingImageSrc} alt="" aspectRatio="4 / 3" />
    </Grid>
  ),
};

/** `render` hands the computed props to a framework image component instead of `<img>`. */
export const CustomRender: Story = {
  args: {
    ...square,
    aspectRatio: '1 / 1',
    render: (props) => (
      <picture>
        <img {...props} data-rendered-by="custom" style={{ ...props.style, maxInlineSize: '16rem' }} />
      </picture>
    ),
  },
};
