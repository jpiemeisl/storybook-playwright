import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Stack } from '../../../components/Stack';
import { coffee, lamp, longTitle, mug, socks, tee } from '../../fixtures';
import { useVariantSelection } from '../../hooks/useVariantSelection';
import type { Product } from '../../types/product';
import { SizeGuide } from '../SizeGuide';
import { VariantSelector } from './VariantSelector';

function Demo({ product, initial }: { product: Product; initial?: Record<string, string> }) {
  const { selection, select, variant } = useVariantSelection(product, initial);
  return (
    <Stack gap="sm">
      <VariantSelector product={product} selection={selection} onChange={select} />
      <p data-testid="variant">{variant ? variant.title : 'No variant'}</p>
    </Stack>
  );
}

const twelve: Product = { ...mug, id: 'twelve', options: [{ name: 'Length', values: Array.from({ length: 12 }, (_, i) => `${40 + i * 5} cm`) }], variants: Array.from({ length: 12 }, (_, i) => ({ id: `len-${i}`, title: `${40 + i * 5} cm`, optionValues: { Length: `${40 + i * 5} cm` }, price: mug.variants[0]!.price, stock: { status: i === 3 ? 'out-of-stock' : 'in-stock' } })) };
const one: Product = { ...mug, id: 'one', options: [{ name: 'Size', values: ['One size'] }], variants: [{ ...mug.variants[0]!, optionValues: { Size: 'One size' } }] };

const meta = { title: 'Commerce/VariantSelector', tags: ['vrt-mobile'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Buttons and swatches (with sold-out and non-existent values), one value, 12 values (select), long names. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <Stack gap="xl">
      <Demo product={tee} initial={{ Size: 'S', Colour: 'Moss' }} />
      <Demo product={socks} />
      <Demo product={lamp} />
      <Demo product={coffee} />
      <Demo product={one} />
      <Demo product={twelve} />
      <Demo product={longTitle} />
    </Stack>
  ),
};

/** Native radios: arrow keys move between values; states are in the accessible names; selecting updates the variant. */
export const Keyboard: Story = {
  render: () => (
    <Stack gap="sm">
      <Demo product={tee} initial={{ Size: 'M', Colour: 'Moss' }} />
      <SizeGuide table={tee.sizeGuide} productTitle={tee.title} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const size = canvas.getByRole('radiogroup', { name: 'Size' });
    await expect(within(size).getByRole('radio', { name: 'XXL, not available with the other options chosen' })).toBeDisabled();
    await expect(canvas.getByRole('radio', { name: 'Sand, sold out' })).toBeEnabled();
    const m = within(size).getByRole('radio', { name: 'M' });
    m.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(within(size).getByRole('radio', { name: 'L' })).toBeChecked();
    await expect(canvas.getByTestId('variant')).toHaveTextContent('L / Moss');
    await userEvent.click(canvas.getByRole('button', { name: 'Size guide' }));
    await waitFor(() => expect(within(document.body).getByRole('dialog', { name: /Size guide/ })).toBeVisible());
    await expect(within(document.body).getByRole('table', { name: /tee sizes/ })).toBeVisible();
  },
};
