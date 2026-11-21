import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Badge } from '../components/Badge';
import { Text } from '../components/Text';
import { BlockRenderer, createRegistry, defineBlock, validatePage, type BlockLike } from '../registry';
import { HeadedBlock } from '../registry/helpers';

/*
 * createRegistry demo: one custom block type with its own content type and toProps, and one built-in
 * type (divider) replaced. The default registry is untouched.
 */

/** A custom block's content type: plain JSON like every other block. */
interface QuoteOfTheDayBlock extends BlockLike {
  type: 'quoteOfTheDay';
  heading?: string;
  quote: string;
  source?: string;
}

interface QuoteCardProps {
  heading?: string;
  level: 2 | 3;
  text: string;
  cite?: string;
}

function QuoteCard({ heading, level, text, cite }: QuoteCardProps) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <figure>
        <blockquote>
          <Text size="lg">“{text}”</Text>
        </blockquote>
        {cite && (
          <figcaption>
            <Text size="sm" tone="muted">
              {cite}
            </Text>
          </figcaption>
        )}
      </figure>
    </HeadedBlock>
  );
}

const registry = createRegistry([
  defineBlock<QuoteOfTheDayBlock, QuoteCardProps>({
    type: 'quoteOfTheDay',
    label: 'Quote of the day',
    description: 'A short quote with its source.',
    component: QuoteCard,
    layout: 'narrow',
    toProps: (content, ctx) => {
      if (!content.quote) {
        ctx.report({ code: 'missing-field', message: 'A quote is required.', path: 'quote' });
        return null;
      }
      return { heading: content.heading, level: ctx.headingLevel === 1 ? 2 : (ctx.headingLevel as 2 | 3), text: content.quote, cite: content.source };
    },
  }),
  // Replaces the built-in divider with a labelled badge.
  defineBlock<BlockLike & { type: 'divider'; label?: string }, { children: string }>({
    type: 'divider',
    label: 'Divider (custom)',
    description: 'Replaced built-in: a badge instead of a rule.',
    component: ({ children }) => <Badge>{children}</Badge>,
    toProps: (content) => ({ children: content.label ?? 'Section break' }),
    defaultPadding: 'sm',
  }),
]);

const blocks: BlockLike[] = [
  { id: 'intro', type: 'pageHeader', title: 'A page with a custom block', description: 'The quote block is defined in this story, not in the library.' } as BlockLike,
  { id: 'quote', type: 'quoteOfTheDay', heading: 'Quote of the day', quote: 'Good enough to decide on beats perfect but late.', source: 'Ana Ruiz, Senior Accountant', background: 'subtle' } as BlockLike,
  { id: 'break', type: 'divider', label: 'Replaced divider' } as BlockLike,
];

const meta = {
  title: 'Content model/createRegistry',
  tags: ['skip-vrt'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <main>
      <BlockRenderer blocks={blocks} registry={registry} showErrors />
    </main>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomAndReplacedBlocks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Quote of the day' })).toBeVisible();
    await expect(canvas.getByText('Replaced divider')).toBeVisible();
    await expect(canvas.queryByText(/Unknown block/)).toBeNull();
    // Validation knows the custom type when given the registry's types.
    await expect(validatePage({ id: 'p', slug: 'demo', seo: { title: 'Demo' }, blocks }, { knownTypes: registry.types() })).toEqual([]);
  },
};
