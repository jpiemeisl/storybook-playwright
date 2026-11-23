/*
 * Internal (not exported from the commerce entry): links an order's downloads to the host's
 * `CommerceContext.downloadHref(productId, fileId)`. Pure.
 */
import type { Order } from '../types/order';
import type { Product } from '../types/product';

type OrderDownload = NonNullable<Order['downloads']>[number];

/**
 * The product a download belongs to: its own `productId` (set by createOrderFromCart), else the product
 * whose digital files include it, else the order's only digital line. Undefined when it can't be told.
 */
export function downloadProductId(order: Pick<Order, 'lines'>, download: OrderDownload, products: readonly Product[] = []): string | undefined {
  if (download.productId) return download.productId;
  const owner = products.find((p) => p.digital?.files.some((f) => f.id === download.fileId));
  if (owner) return owner.id;
  const digital = [...new Set(order.lines.filter((l) => l.snapshot.kind === 'digital').map((l) => l.productId))];
  return digital.length === 1 ? digital[0] : undefined;
}

/**
 * A DownloadList `hrefFor` for an order's files from the host's `downloadHref`, or undefined without one
 * (DownloadList then shows "#" placeholders). Files whose product can't be told also get "#".
 */
export function orderDownloadHref(order: Pick<Order, 'lines'>, downloadHref: ((productId: string, fileId: string) => string) | undefined, products?: readonly Product[]): ((download: OrderDownload) => string) | undefined {
  if (!downloadHref) return undefined;
  return (download) => {
    const productId = downloadProductId(order, download, products);
    return productId ? downloadHref(productId, download.fileId) : '#';
  };
}
