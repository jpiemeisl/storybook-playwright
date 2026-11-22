/* The subscription action matrix in docs/commerce-account.md must match the logic and fixtures. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accountSubscriptions, DEMO_NOW, type AccountSubscriptionKey } from '../fixtures';
import { getSubscriptionActions, getSubscriptionStatusInfo } from './account';

const doc = readFileSync(new URL('../../../docs/commerce-account.md', import.meta.url), 'utf8');
const table = doc.slice(doc.indexOf('<!-- action-matrix:start -->'), doc.indexOf('<!-- action-matrix:end -->'));
const rows = table
  .split('\n')
  .filter((line) => line.startsWith('| ') && !line.startsWith('| Fixture') && !line.startsWith('| ---'))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

describe('docs subscription action matrix', () => {
  it('lists every subscription fixture', () => {
    expect(rows.map((r) => r[0]).sort()).toEqual(Object.keys(accountSubscriptions).sort());
  });

  it.each(rows)('%s matches getSubscriptionStatusInfo and getSubscriptionActions', (key, label, text, actions) => {
    const sub = accountSubscriptions[key as AccountSubscriptionKey];
    const info = getSubscriptionStatusInfo(sub, DEMO_NOW);
    expect([info.label, info.description, getSubscriptionActions(sub).join(', ')]).toEqual([label, text, actions]);
  });
});
