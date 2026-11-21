import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Stack } from '../../../components/Stack';
import { QuantityStepper } from './QuantityStepper';

const meta = { title: 'Commerce/QuantityStepper' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** At the minimum, in the middle, at the maximum, and limited by stock. */
export const States: Story = {
  render: () => (
    <Stack gap="lg">
      <QuantityStepper productTitle="Stoneware mug" />
      <QuantityStepper productTitle="Organic cotton tee" defaultValue={4} />
      <QuantityStepper productTitle="Basil seed packet" defaultValue={99} />
      <QuantityStepper productTitle="Beeswax pillar candle" defaultValue={3} maxFromStock={3} />
    </Stack>
  ),
};

/** Stepping up to the stock limit disables plus, shows why, and announces each change. */
export const StockLimit: Story = {
  render: () => <QuantityStepper productTitle="Beeswax pillar candle" maxFromStock={3} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plus = canvas.getByRole('button', { name: 'Increase quantity of Beeswax pillar candle' });
    await userEvent.click(plus);
    await userEvent.click(plus);
    await expect(canvas.getByRole('status')).toHaveTextContent('Quantity 3');
    await expect(plus).toBeDisabled();
    await expect(canvas.getByText('Only 3 available')).toBeVisible();
    await expect(canvas.getByRole('spinbutton', { name: 'Quantity' })).toHaveAccessibleDescription('Only 3 available');
  },
};

/** Typing an invalid value reverts on blur. */
export const InvalidInput: Story = {
  render: () => <QuantityStepper productTitle="Stoneware mug" defaultValue={2} />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('spinbutton', { name: 'Quantity' });
    await userEvent.click(input);
    await userEvent.keyboard('{End}{Backspace}0');
    await expect(input).toHaveValue(0);
    input.blur();
    await waitFor(() => expect(input).toHaveValue(2));
    await expect(within(canvasElement).getByRole('button', { name: 'Decrease quantity of Stoneware mug' })).toBeEnabled();
  },
};
