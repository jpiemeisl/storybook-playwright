import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { expectCurrentPage, expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Search results',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'search-results' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const form = (canvasElement: HTMLElement) => within(canvasElement).getByRole('search', { name: 'Search the site' });

export const NoQuery: Story = { args: { name: 'search-no-query' } };

/** Ten results, page 1 of 5. */
export const Results: Story = {
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    const search = form(canvasElement);
    await expect(search).toHaveAttribute('method', 'get');
    await expect(search).toHaveAttribute('action', '/search');
    await expect(within(search).getByRole('searchbox')).toHaveAttribute('name', 'q');
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Showing 1–10 of 48 results for “payroll”');
    await expectCurrentPage(canvasElement, 'Search result pages', 1);
  },
};

export const OneResult: Story = { args: { name: 'search-one-result' } };
export const NoResults: Story = { args: { name: 'search-no-results' } };

export const LongTitles: Story = {
  args: { name: 'search-long-titles' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** Typing a new query. A host handler (ctx.onSearch) intercepts the submit, so nothing hits the network. */
export const AfterTyping: Story = {
  args: { name: 'search-no-query' },
  play: async ({ canvasElement, args }) => {
    const search = form(canvasElement);
    const input = within(search).getByRole('searchbox');
    await userEvent.type(input, 'quarterly tax');
    await userEvent.click(within(search).getByRole('button', { name: 'Search' }));
    await expect(args.onSearch).toHaveBeenCalledWith('quarterly tax');
    await expect(input).toHaveValue('quarterly tax');
    input.blur();
  },
};
