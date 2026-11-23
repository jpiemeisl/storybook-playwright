import { describe, expect, it } from 'vitest';
import { catalog, confirmationOrders, orders } from '../fixtures';
import { downloadProductId, orderDownloadHref } from './downloads';

const href = (productId: string, fileId: string) => `/files/${productId}/${fileId}`;

describe('orderDownloadHref', () => {
  it('is undefined without a host downloadHref (DownloadList keeps its "#" placeholders)', () => {
    expect(orderDownloadHref(confirmationOrders.digital, undefined)).toBeUndefined();
  });

  it('uses the productId createOrderFromCart sets on each download', () => {
    const order = confirmationOrders.digital;
    const hrefFor = orderDownloadHref(order, href)!;
    const guide = order.downloads!.find((d) => d.fileId === 'guide-pdf')!;
    expect(hrefFor(guide)).toBe('/files/prod-guide/guide-pdf');
  });

  it('falls back to the catalog, then to the only digital line, then to "#"', () => {
    const legacy = orders.mixed; // downloads without productId
    const file = legacy.downloads![0]!;
    expect(downloadProductId(legacy, file, catalog.products)).toBe('prod-guide');
    expect(downloadProductId(legacy, file)).toBe(legacy.lines.find((l) => l.snapshot.kind === 'digital')!.productId);
    const noDigital = { lines: legacy.lines.filter((l) => l.snapshot.kind !== 'digital') };
    expect(orderDownloadHref(noDigital, href)!(file)).toBe('#');
  });
});
