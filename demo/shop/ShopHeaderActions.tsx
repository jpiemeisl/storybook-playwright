/*
 * DEMO ONLY. The shop's header controls: search, the account link ("Sign in" or the customer's name)
 * and the cart button with its live count, which opens the MiniCart.
 */
import { useEffect, useState } from 'react';
import { Icon } from '../../src/components/Icon';
import { Link } from '../../src/components/Link';
import { CartIcon, getCartIssues, MiniCart } from '../../src/commerce';
import { products } from '../../src/commerce/fixtures';
import { useDemoAccount, useDemoCart } from '../commerce';
import { lineHref } from './shopContext';
import { useShopRouter } from './router';
import styles from './DemoShop.module.css';

export function ShopHeaderActions() {
  const cart = useDemoCart();
  const { customer } = useDemoAccount();
  const { location } = useShopRouter();
  const [open, setOpen] = useState(false);

  // A link inside the drawer navigates in memory: close the drawer with it.
  useEffect(() => setOpen(false), [location.href]);

  const firstName = customer?.name.split(' ')[0];
  return (
    <>
      <Link href="/search" className={`${styles.headerLink} ${styles.wideOnly}`}>
        <Icon name="search" />
        <span className={styles.narrowHidden}>Search</span>
      </Link>
      <Link href={customer ? '/account' : '/login'} className={`${styles.headerLink} ${styles.wideOnly}`} aria-label={customer ? `Account: ${customer.name}` : undefined}>
        <Icon name="user" />
        <span className={styles.narrowHidden}>{firstName ?? 'Sign in'}</span>
      </Link>
      <CartIcon count={cart.totals.itemCount} onClick={() => setOpen(true)} expanded={open} />
      <MiniCart
        open={open}
        onClose={() => setOpen(false)}
        cart={cart.cart}
        totals={cart.totals}
        issues={getCartIssues(cart.cart, products)}
        lineHref={lineHref}
        onQuantityChange={cart.setQuantity}
        onRemove={cart.removeLine}
        links={{ cart: '/cart', checkout: '/checkout', shop: '/collections/all' }}
      />
    </>
  );
}
