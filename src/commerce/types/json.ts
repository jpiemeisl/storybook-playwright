/* Compile-time guard: commerce types stay JSON-serializable (no functions, Dates or React nodes). */
import type { IsJson } from '../../content-types/json';
import type { Cart, Catalog, CustomerSubscription, Order, PromoCode, Review } from './index';

type Assert<T extends true> = T;
export type _CommerceIsJson = Assert<IsJson<Catalog | Cart | Order | CustomerSubscription | PromoCode | Review>>;
