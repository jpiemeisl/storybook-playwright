import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { faqs } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Accordion, FaqSection } from './Accordion';

const items = faqs.map(({ id, question, answer }) => ({ id, title: question, content: answer }));

const meta = {
  title: 'Sections/Accordion',
  component: Accordion,
  tags: ['vrt-mobile'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { items, allowMultiple: false },
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <Accordion {...args} />
    </div>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const trigger = (canvas: ReturnType<typeof within>, index: number) =>
  canvas.getByRole('button', { name: items[index]!.title });

export const Collapsed: Story = {};

/** Mouse: clicking the first header expands it and reveals its region. */
export const FirstExpanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(trigger(canvas, 0));
    await expect(trigger(canvas, 0)).toHaveAttribute('aria-expanded', 'true');
    // The panel's visibility animates with its height, so wait for it rather than asserting instantly.
    await expect(await canvas.findByRole('region', { name: items[0]!.title })).toBeVisible();
  },
};

/** allowMultiple: opening a second panel keeps the first open. */
export const SeveralExpanded: Story = { tags: ['theme-smoke'],
  args: { allowMultiple: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(trigger(canvas, 0));
    await userEvent.click(trigger(canvas, 2));
    await expect(trigger(canvas, 0)).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(canvas, 2)).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Single-open (default): opening a second panel closes the first. */
export const SingleOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(trigger(canvas, 0));
    await userEvent.click(trigger(canvas, 1));
    await expect(trigger(canvas, 0)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(canvas, 1)).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.queryByRole('region', { name: items[0]!.title })).toBeNull());
  },
};

/** Keyboard: arrows/Home/End move between headers; Enter and Space toggle. */
export const Keyboard: Story = {
  // Behaviour test: its screenshots were identical to SingleOpen's at every width, so it isn't captured.
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    trigger(canvas, 0).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger(canvas, 1)).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(trigger(canvas, items.length - 1)).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger(canvas, 0)).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(trigger(canvas, items.length - 1)).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(trigger(canvas, 0)).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(trigger(canvas, 0)).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    await expect(trigger(canvas, 0)).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    await expect(trigger(canvas, 1)).toHaveAttribute('aria-expanded', 'true');
  },
};

export const DefaultExpanded: Story = {
  args: { defaultExpanded: ['taxes'] },
};

export const FaqSectionDefault: Story = {
  tags: ['!vrt-mobile', 'vrt-full'],
  render: () => <FaqSection items={faqs} intro="Still stuck? Email hello@brightside.example and we’ll reply within a working day." />,
};

export const FaqSectionOnSubtle: Story = {
  tags: ['!vrt-mobile', 'vrt-full'],
  parameters: { surface: 'subtle' },
  render: () => <FaqSection items={faqs} allowMultiple />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: faqs[1]!.question }));
    await expect(canvas.getByRole('button', { name: faqs[1]!.question })).toHaveAttribute('aria-expanded', 'true');
  },
};
