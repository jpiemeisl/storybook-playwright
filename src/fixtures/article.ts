/*
 * A long-form article written once as blocks, rendered two ways: as React nodes (Prose children)
 * and as an HTML string (Prose sanitizedHtml). Inline markup: `code` and [text](href).
 */
import { createElement as h, Fragment, type ReactNode } from 'react';
import type { TocItem } from '../content-types/content';
import { fixtureImages } from './images';

type ListItem = string | { text: string; children: string[] };
type Block =
  | { type: 'h2' | 'h3'; id: string; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul' | 'ol'; items: ListItem[] }
  | { type: 'quote'; text: string; cite: string }
  | { type: 'code'; code: string }
  | { type: 'table'; caption: string; head: string[]; rows: string[][] }
  | { type: 'figure'; src: string; alt: string; width: number; height: number; caption: string }
  | { type: 'dl'; items: [string, string][] }
  | { type: 'hr' };

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const articleBlocks: Block[] = [
  { type: 'p', text: 'Most small businesses close their books weeks after the month ends, if they close them at all. By then the numbers are history: useful for tax, useless for decisions. A five-day close is achievable for almost any business with fewer than fifty employees, and it does not need new software. It needs a routine.' },
  { type: 'p', text: 'This guide is the routine we use with clients at Brightside. It assumes you already use accounting software with bank feeds, and that someone (you, a team member or us) can spend an hour or two on each of the first five working days of the month.' },
  { type: 'h2', id: 'why-five-days', text: 'Why five working days?' },
  { type: 'p', text: 'Five days is long enough for card statements and supplier invoices to arrive, and short enough that the previous month is still fresh. Ask a manager about an unusual expense on day three and they will remember it. Ask on day twenty and they will guess.' },
  { type: 'quote', text: 'The goal of a monthly close is not perfect books. It is books that are good enough to make a decision on, delivered while the decision still matters.', cite: 'Ana Ruiz, Senior Accountant' },
  { type: 'h2', id: 'before-you-start', text: 'Before you start' },
  { type: 'p', text: 'Three things make the rest of the process fast. If any of them are missing, fix them first; it is a one-time job.' },
  {
    type: 'ul',
    items: [
      'Every business bank account and card is connected to a live bank feed.',
      { text: 'Receipts reach your software without manual typing:', children: ['a forwarding email address for supplier invoices', 'a phone app for paper receipts', 'automatic matching rules for regular payments'] },
      'There is one person who owns the close, even if several people help.',
    ],
  },
  { type: 'h2', id: 'day-one', text: 'Day 1: Bank and card reconciliation' },
  { type: 'p', text: 'Reconcile every account to its statement balance on the last day of the month. Work through the unmatched transactions oldest first. Anything you cannot explain in two minutes goes on a questions list rather than blocking the reconciliation.' },
  { type: 'p', text: 'In most software the reconciliation report shows a difference of zero when you are done. If it does not, the usual culprits are a duplicated bank feed transaction, a payment entered manually and then imported again, or an opening balance that was never set. Search for the exact difference amount; it is often a single transaction.' },
  { type: 'h3', id: 'matching-rules', text: 'Matching rules that save time' },
  { type: 'p', text: 'Create rules for anything that repeats: rent, software subscriptions, payroll transfers, loan repayments. A good rule matches on the payee name and an amount range, and assigns both the account and the tax code. Review your rules every quarter, because suppliers change their billing names more often than you would think.' },
  { type: 'code', code: 'Rule: "Acme Software"\n  when  payee contains "ACME SOFT"\n  and   amount between 49.00 and 59.00\n  then  account  = 6420 Software subscriptions\n        tax    = Standard rate' },
  { type: 'h2', id: 'day-two', text: 'Day 2: Receivables and payables' },
  { type: 'p', text: 'Compare your aged receivables report with what customers actually owe. Chase anything more than thirty days overdue today, not at the end of the quarter. On the payables side, make sure every supplier invoice for the month is entered, even if you will pay it later. Use `Ctrl` + `F` in the aged reports to find duplicates quickly; a supplier with two open invoices for the same amount on the same day is almost always a duplicate.' },
  { type: 'h3', id: 'accruals', text: 'Accruals in plain language' },
  { type: 'p', text: 'An accrual records a cost in the month it belongs to, even if the invoice arrives later. Utilities and contractors are the common ones. If you know roughly what March electricity will cost but the bill comes in April, record an estimate in March and reverse it when the bill arrives. Your software can usually reverse it automatically on the first day of the next month.' },
  { type: 'h2', id: 'day-three', text: 'Day 3: Payroll and fixed assets' },
  { type: 'p', text: 'Check that payroll journals match the payroll provider’s summary: gross pay, employer taxes, benefits and net pay. Then look at anything you bought that will last more than a year. Equipment, vehicles and major software licences belong on the balance sheet and are depreciated, not expensed all at once.' },
  {
    type: 'figure',
    src: fixtureImages.heroDesk.src,
    alt: 'Printed invoices and a calculator on a desk',
    width: 1200,
    height: 800,
    caption: 'Paper still turns up. Photograph it on the day it arrives and file the original by month.',
  },
  { type: 'h2', id: 'day-four', text: 'Day 4: Review the numbers' },
  { type: 'p', text: 'This is the step most businesses skip, and it is the one that catches mistakes. Put this month next to the previous three and look for anything that moved by more than ten percent.' },
  {
    type: 'table',
    caption: 'Example: a four-month comparison of key expense lines (USD)',
    head: ['Account', 'Dec', 'Jan', 'Feb', 'Mar'],
    rows: [
      ['Rent', '4,200', '4,200', '4,200', '4,200'],
      ['Software', '612', '648', '651', '1,302'],
      ['Contractors', '3,850', '2,900', '4,100', '3,975'],
      ['Travel', '220', '1,480', '310', '265'],
    ],
  },
  { type: 'p', text: 'In the example, software doubled in March. That could be an annual renewal (fine, but it should probably be spread across the year) or a duplicate subscription (worth cancelling). Either way, you only notice it because you looked.' },
  { type: 'h3', id: 'wide-reports', text: 'Reading a full-year report' },
  { type: 'p', text: 'A rolling twelve-month view is wider than most screens. Scroll it sideways rather than shrinking the text until it is unreadable.' },
  {
    type: 'table',
    caption: 'Monthly revenue by location, previous twelve months (USD thousands)',
    head: ['Location', ...months],
    rows: [
      ['Harbour Street', '41', '38', '44', '47', '52', '55', '61', '58', '49', '46', '44', '63'],
      ['Mill Lane', '22', '21', '25', '24', '27', '29', '31', '30', '26', '25', '24', '35'],
      ['Online store', '17', '15', '18', '21', '19', '22', '24', '26', '28', '31', '37', '52'],
    ],
  },
  { type: 'h2', id: 'day-five', text: 'Day 5: Report and lock' },
  { type: 'p', text: 'Send a one-page summary to whoever needs it: revenue, gross margin, cash at bank, money owed to you and money you owe. Then lock the period in your software so nobody changes it by accident. If something needs fixing later, record an adjustment in the current month rather than reopening the old one.' },
  {
    type: 'ol',
    items: [
      'Export the profit and loss and balance sheet.',
      'Add three sentences on what changed and why.',
      { text: 'Lock the period:', children: ['set the lock date to the last day of the month', 'note the date in your close checklist'] },
      'File the questions list for next month’s review.',
    ],
  },
  { type: 'h2', id: 'common-mistakes', text: 'Common mistakes' },
  { type: 'p', text: 'The first close always takes longer than five days. That is normal: you are cleaning up months of small inconsistencies at once. By the third month most businesses are inside the window, and by the sixth the whole routine takes a few hours spread across the week.' },
  { type: 'p', text: 'The mistakes we see most often are not technical. They are about habits. Owners skip the review on day four because the numbers "look about right", questions lists grow until nobody reads them, and periods stay unlocked so last month keeps quietly changing. Each of these undermines the one thing a close is for: numbers you can trust enough to act on.' },
  { type: 'p', text: 'If you only adopt one part of this guide, make it the review. Fifteen minutes comparing this month with the last three catches more problems than any amount of careful data entry, and it is the part of the routine that turns bookkeeping into management information.' },
  { type: 'h2', id: 'glossary', text: 'Glossary' },
  {
    type: 'dl',
    items: [
      ['Reconciliation', 'Checking that your records match an external statement, such as a bank or card statement.'],
      ['Accrual', 'A cost or income recorded in the period it belongs to, before the invoice or payment.'],
      ['Lock date', 'A date before which transactions cannot be added or changed without permission.'],
    ],
  },
  { type: 'hr' },
  { type: 'p', text: 'Want a second pair of eyes on your first few closes? [Book a free consultation](/consultation) and we will walk through your last month with you.' },
];

export const shortArticleBlocks: Block[] = [
  { type: 'p', text: 'We are closed on Monday 26 May for the public holiday. Payroll runs scheduled for that day will go out on Friday 23 May instead, so staff are paid on time.' },
  { type: 'p', text: 'Questions? Email [hello@brightside.example](mailto:hello@brightside.example).' },
];

/* ---------- inline markup ---------- */

const INLINE = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inlineNodes(text: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, index) => {
    if (part.startsWith('`')) return h('code', { key: index }, part.slice(1, -1));
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return h('a', { key: index, href: link[2] }, link[1]);
    return part;
  });
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineHtml(text: string): string {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('`')) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) return `<a href="${escapeHtml(link[2]!)}">${escapeHtml(link[1]!)}</a>`;
      return escapeHtml(part);
    })
    .join('');
}

/* ---------- renderers ---------- */

function listNode(tag: 'ul' | 'ol', items: ListItem[], key?: number): ReactNode {
  return h(
    tag,
    { key },
    items.map((item, index) =>
      typeof item === 'string'
        ? h('li', { key: index }, inlineNodes(item))
        : h('li', { key: index }, inlineNodes(item.text), listNode('ul', item.children)),
    ),
  );
}

export function renderBlocks(blocks: Block[]): ReactNode {
  return h(
    Fragment,
    null,
    blocks.map((block, key) => {
      switch (block.type) {
        case 'h2':
        case 'h3':
          return h(block.type, { key, id: block.id }, block.text);
        case 'p':
          return h('p', { key }, inlineNodes(block.text));
        case 'ul':
        case 'ol':
          return listNode(block.type, block.items, key);
        case 'quote':
          return h('blockquote', { key }, h('p', null, block.text), h('p', null, '— ', block.cite));
        case 'code':
          return h('pre', { key }, h('code', null, block.code));
        case 'table':
          return h(
            'table',
            { key },
            h('caption', null, block.caption),
            h('thead', null, h('tr', null, block.head.map((cell, i) => h('th', { key: i, scope: 'col' }, cell)))),
            h('tbody', null, block.rows.map((row, r) => h('tr', { key: r }, row.map((cell, c) => h(c === 0 ? 'th' : 'td', { key: c, scope: c === 0 ? 'row' : undefined }, cell))))),
          );
        case 'figure':
          return h(
            'figure',
            { key },
            h('img', { src: block.src, alt: block.alt, width: block.width, height: block.height }),
            h('figcaption', null, block.caption),
          );
        case 'dl':
          return h('dl', { key }, block.items.flatMap(([term, definition], i) => [h('dt', { key: `t${i}` }, term), h('dd', { key: `d${i}` }, definition)]));
        case 'hr':
          return h('hr', { key });
      }
    }),
  );
}

function listHtml(tag: 'ul' | 'ol', items: ListItem[]): string {
  return `<${tag}>${items
    .map((item) => (typeof item === 'string' ? `<li>${inlineHtml(item)}</li>` : `<li>${inlineHtml(item.text)}${listHtml('ul', item.children)}</li>`))
    .join('')}</${tag}>`;
}

/** The same article as an HTML string. Built only from the trusted fixture above. */
export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
        case 'h3':
          return `<${block.type} id="${block.id}">${escapeHtml(block.text)}</${block.type}>`;
        case 'p':
          return `<p>${inlineHtml(block.text)}</p>`;
        case 'ul':
        case 'ol':
          return listHtml(block.type, block.items);
        case 'quote':
          return `<blockquote><p>${escapeHtml(block.text)}</p><p>— ${escapeHtml(block.cite)}</p></blockquote>`;
        case 'code':
          return `<pre><code>${escapeHtml(block.code)}</code></pre>`;
        case 'table':
          return `<table><caption>${escapeHtml(block.caption)}</caption><thead><tr>${block.head.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${block.rows
            .map((row) => `<tr>${row.map((c, i) => (i === 0 ? `<th scope="row">${escapeHtml(c)}</th>` : `<td>${escapeHtml(c)}</td>`)).join('')}</tr>`)
            .join('')}</tbody></table>`;
        case 'figure':
          return `<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="${block.width}" height="${block.height}"><figcaption>${escapeHtml(block.caption)}</figcaption></figure>`;
        case 'dl':
          return `<dl>${block.items.map(([t, d]) => `<dt>${escapeHtml(t)}</dt><dd>${escapeHtml(d)}</dd>`).join('')}</dl>`;
        case 'hr':
          return '<hr>';
      }
    })
    .join('\n');
}

export const articleNode = renderBlocks(articleBlocks);
export const articleHtml = blocksToHtml(articleBlocks);
export const shortArticleNode = renderBlocks(shortArticleBlocks);

export const articleToc: TocItem[] = articleBlocks
  .filter((block): block is Extract<Block, { type: 'h2' | 'h3' }> => block.type === 'h2' || block.type === 'h3')
  .map((block) => ({ id: block.id, label: block.text, level: block.type === 'h2' ? 2 : 3 }));

/** Approximate word count of the long article (for the fixture brief: about 1,200 words). */
export const articleWordCount = articleBlocks
  .map((block) => ('text' in block ? block.text : 'code' in block ? block.code : ''))
  .join(' ')
  .split(/\s+/).length;
