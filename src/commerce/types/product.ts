/*
 * Catalogue types. JSON-serializable only: dates are ISO 8601 strings, money is integer minor units
 * (the core Money type), images are ImageRef. These are the future contract for commerce adapters.
 */
import type { Money } from '../../content-types/money';
import type { ImageRef, RichText, SeoMeta } from '../../content-types/shared';

/** What kind of thing is sold. Drives shipping (physical only) and checkout steps. */
export type ProductKind = 'physical' | 'digital' | 'subscription';

/** A product option such as Size or Colour. */
export interface ProductOption {
  /** Option name, e.g. "Size". Unique within the product. */
  name: string;
  /** Allowed values in display order, e.g. ["S", "M", "L"]. Non-empty, unique. A value may exist on no variant. */
  values: string[];
}

/** Stock state of one variant. */
export interface StockInfo {
  /**
   * `in-stock`, `low-stock` (show "Only N left"), `out-of-stock` (cannot be bought), `backorder`
   * (can be bought, ships later) or `preorder` (can be bought before release).
   */
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'backorder' | 'preorder';
  /** Units available. Integer >= 0. Optional; shown for low stock. */
  quantity?: number;
  /** ISO 8601 date when stock returns (backorder, out-of-stock) or the release date (preorder). */
  availableOn?: string;
}

/** One purchasable combination of option values. */
export interface Variant {
  /** Unique within the product. */
  id: string;
  /** Stock keeping unit. Unique within the product when present. */
  sku?: string;
  /** Display title, e.g. "M / Moss" or "Default". */
  title: string;
  /** Option name → value. Keys are exactly the product's option names; values come from each option's values. `{}` when the product has no options. */
  optionValues: Record<string, string>;
  /** Price per unit for one-time purchase, before any subscription discount. Integer minor units, >= 0. */
  price: Money;
  /** Original price when on sale. Same currency as `price` and greater than it. */
  compareAtPrice?: Money;
  /** Stock state. */
  stock: StockInfo;
  /** Index into the product's `images` for this variant. */
  imageIndex?: number;
  /** Shipping weight in grams. Integer > 0. Physical products only. */
  weight?: number;
}

/** A recurring billing interval. */
export interface BillingInterval {
  /** Calendar unit. */
  unit: 'week' | 'month' | 'year';
  /** Number of units per billing cycle. Integer >= 1, e.g. 3 months = quarterly. */
  count: number;
}

/** A one-time purchase. */
export interface OneTimePurchase {
  /** Discriminator. */
  type: 'one-time';
}

/** A recurring purchase (subscription, or "subscribe and save" on a physical product). */
export interface SubscriptionPurchase {
  /** Discriminator. */
  type: 'subscription';
  /** Billing interval. */
  interval: BillingInterval;
  /** Discount off the variant price on every cycle, 0-100. Rounded half away from zero to the minor unit. */
  discountPercent?: number;
  /** Free trial length in days, integer >= 0. Nothing is charged until it ends. */
  trialDays?: number;
}

/**
 * How a product can be bought. Rules: physical and digital products may offer one-time and (for
 * physical) subscribe-and-save options; a product of kind `subscription` offers only subscription options.
 */
export type PurchaseOption = OneTimePurchase | SubscriptionPurchase;

/** A downloadable file. */
export interface DigitalFile {
  /** Unique within the product. */
  id: string;
  /** File name shown to the customer. */
  name: string;
  /** Format label, e.g. "PDF", "ZIP", "MP3". */
  format: string;
  /** File size in bytes. Integer >= 0. */
  sizeBytes: number;
  /** What the file contains. */
  description?: string;
}

/** Delivery details for digital products. Required when kind is `digital`. */
export interface DigitalDelivery {
  /** Files included. At least one. */
  files: DigitalFile[];
  /** Licence terms. */
  licence?: { type: 'single' | 'team' | 'unlimited'; summary: string };
  /** Available immediately after purchase. */
  instant: boolean;
  /** Days the download links stay active. Integer >= 1. Omit for unlimited access. */
  accessDays?: number;
}

/** Terms shown for subscription products. Required when kind is `subscription`. */
export interface SubscriptionTerms {
  /** Can be cancelled at any time without a fee. */
  cancelAnytime: boolean;
  /** Minimum commitment in months. Integer >= 1. */
  minimumTermMonths?: number;
  /** Short note shown near the price, e.g. "Billed on the 1st of each month". */
  billingNote?: string;
}

/** A product in the catalogue. */
export interface Product {
  /** Unique within the catalogue. */
  id: string;
  /** URL slug: lowercase letters, digits and hyphens. Unique within the catalogue. */
  handle: string;
  /** Physical, digital or subscription. */
  kind: ProductKind;
  /** Product name. */
  title: string;
  /** One-line summary for cards. */
  summary?: string;
  /** Full description (sanitized HTML; the library does not sanitize). */
  description: RichText;
  /** Brand or maker. Fictional in fixtures. */
  brand?: string;
  /** Free-form tags for filtering. */
  tags?: string[];
  /** Images, first is the primary image. May be empty. */
  images: ImageRef[];
  /** Options such as Size and Colour. Empty for a product with a single default variant. */
  options: ProductOption[];
  /** At least one variant. All share one currency. */
  variants: Variant[];
  /** At least one purchase option (see PurchaseOption rules). */
  purchaseOptions: PurchaseOption[];
  /** Required when kind is `digital`. */
  digital?: DigitalDelivery;
  /** Required when kind is `subscription`. */
  subscription?: SubscriptionTerms;
  /** Review summary: average 0-5 (one decimal), count integer >= 0. */
  rating?: { average: number; count: number };
  /** Short merchandising labels, e.g. "New", "Bestseller". */
  badges?: string[];
  /** Page metadata. */
  seo?: SeoMeta;
}

/** A review of a product. */
export interface Review {
  /** Unique within the product. */
  id: string;
  /** Display name of the reviewer. */
  author: string;
  /** Whole stars, integer 1-5. */
  rating: number;
  /** Optional headline. */
  title?: string;
  /** Review text, plain. */
  body: string;
  /** ISO 8601 date-time. */
  createdAt: string;
  /** The reviewer bought the product. */
  verified?: boolean;
}

/** A named group of products for listing pages. */
export interface Collection {
  /** Unique within the catalogue. */
  id: string;
  /** URL slug. */
  handle: string;
  /** Collection name. */
  title: string;
  /** Short description. */
  description?: string;
  /** Product ids in display order. */
  productIds: string[];
}

/** Products plus collections. */
export interface Catalog {
  /** All products. */
  products: Product[];
  /** Collections referencing product ids. */
  collections: Collection[];
}
