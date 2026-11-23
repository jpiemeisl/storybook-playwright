import type { ReactNode } from 'react';
import { EmptyState } from '../../../components/EmptyState';

/** Props for EmptyCart, the empty state shown when the cart has no lines. */
export interface EmptyCartProps {
  /** Where "Continue shopping" goes. Default "/shop". */
  shopHref?: string;
  /** Default "Your cart is empty". */
  title?: string;
  /** Default: a short line about adding items. */
  message?: ReactNode;
  /** Optional slot, e.g. recently viewed products. */
  children?: ReactNode;
  headingLevel?: 2 | 3;
}

/** The empty cart: the core EmptyState with a "Continue shopping" action and an optional recently-viewed slot. */
export function EmptyCart({ shopHref = '/shop', title = 'Your cart is empty', message = 'Items you add to your cart will appear here.', children, headingLevel = 2 }: EmptyCartProps) {
  return (
    <EmptyState title={title} message={message} action={{ label: 'Continue shopping', href: shopHref }} headingLevel={headingLevel}>
      {children}
    </EmptyState>
  );
}
