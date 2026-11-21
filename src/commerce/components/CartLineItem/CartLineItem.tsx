import { Button } from '../../../components/Button';
import { Icon, type IconName } from '../../../components/Icon';
import { Image } from '../../../components/Image';
import { Link } from '../../../components/Link';
import type { CartTotals } from '../../logic/cart';
import { getCartLineNotes, type CartIssue, type CartLineNote, type CartLineNoteKind } from '../../logic/cartLines';
import type { CartLine } from '../../types/cart';
import { Price } from '../Price';
import { QuantityStepper } from '../QuantityStepper';
import styles from './CartLineItem.module.css';

export interface CartLineItemProps {
  line: CartLine;
  /** This line's amounts from computeCartTotals (`totals.lines`): unit price after subscription discount, line total. */
  amounts: CartTotals['lines'][number];
  /** Product page URL for the title link. */
  href: string;
  /** Display notes. Default getCartLineNotes(line) (pass getCartNotes for catalogue-aware notes). */
  notes?: CartLineNote[];
  /** A stock problem from getCartIssues, shown with an icon and text. */
  issue?: CartIssue;
  /** `updating` marks the line busy; `error` shows an inline message. */
  status?: 'idle' | 'updating' | 'error';
  /** `full` (cart page) or `compact` (MiniCart, OrderSummary: smaller, stepper only when onQuantityChange is given). */
  variant?: 'full' | 'compact';
  /** Shows the quantity stepper (physical lines only). */
  onQuantityChange?: (lineId: string, quantity: number) => void;
  /** Shows the remove button. */
  onRemove?: (lineId: string) => void;
  /** Shows "Save for later" next to a stock issue. A callback slot only: saving is up to the host. */
  onSaveForLater?: (lineId: string) => void;
}

const noteIcon: Record<CartLineNoteKind, IconName> = { renewal: 'repeat', trial: 'calendar', download: 'download', 'ships-separately': 'truck', savings: 'tag' };

/**
 * One cart line: image, title link, variant, notes, unit price, quantity, line total and remove. The
 * stepper shows only for physical lines (digital and subscription products are fixed at their quantity,
 * shown as text). Horizontal on wide containers and stacked on narrow ones (container queries). The root
 * has id "line-<id>" and tabIndex -1 so issue summaries can link to it.
 */
export function CartLineItem({ line, amounts, href, notes, issue, status = 'idle', variant = 'full', onQuantityChange, onRemove, onSaveForLater }: CartLineItemProps) {
  const { snapshot } = line;
  const option = line.purchaseOption;
  const subscription = option.type === 'subscription' ? option : undefined;
  const shownNotes = notes ?? getCartLineNotes(line);
  const stepper = onQuantityChange && snapshot.kind === 'physical';
  const compact = variant === 'compact';
  const issueId = `line-${line.id}-issue`;

  return (
    <article id={`line-${line.id}`} tabIndex={-1} className={[styles.root, styles[variant]].join(' ')} aria-busy={status === 'updating' || undefined} aria-labelledby={`line-${line.id}-title`}>
      <div className={styles.line} data-issue={issue ? issue.kind : undefined}>
        <div className={styles.media}>{snapshot.image ? <Image {...snapshot.image} alt="" sizes="6rem" aspectRatio={1} fit="cover" className={styles.image} /> : <span className={styles.placeholder} aria-hidden="true" />}</div>

        <div className={styles.details}>
          <h3 id={`line-${line.id}-title`} className={styles.title}>
            <Link href={href}>{snapshot.title}</Link>
          </h3>
          {snapshot.variantTitle && <p className={styles.variant}>{snapshot.variantTitle}</p>}
          {shownNotes.length > 0 && (
            <ul className={styles.notes}>
              {shownNotes.map((note) => (
                <li key={note.kind}>
                  <Icon name={noteIcon[note.kind]} size="sm" />
                  {note.text}
                </li>
              ))}
            </ul>
          )}
          {!compact && (
            <div className={styles.unit}>
              <span className={styles.visuallyHidden}>Unit price: </span>
              <Price price={amounts.unitPrice} compareAt={subscription ? undefined : snapshot.compareAtPrice} interval={subscription?.interval} size="sm" />
            </div>
          )}
        </div>

        <div className={styles.quantity}>
          {stepper ? (
            // Over stock: keep the real quantity visible and only allow decreasing; the issue text explains.
            <QuantityStepper value={line.quantity} onChange={(q) => onQuantityChange(line.id, q)} max={issue?.kind === 'quantity-above-stock' ? line.quantity : Math.max(99, line.quantity)} productTitle={snapshot.title} name={`quantity-${line.id}`} />
          ) : (
            <p className={styles.fixedQuantity}>Qty {line.quantity}</p>
          )}
        </div>

        <div className={styles.total}>
          <span className={styles.visuallyHidden}>Line total: </span>
          {amounts.trialDays ? <span className={styles.free}>Free today</span> : <Price price={amounts.total} interval={subscription?.interval} size={compact ? 'sm' : 'md'} align="end" />}
        </div>

        {onRemove && (
          <div className={styles.remove}>
            <Button variant="ghost" size="sm" onClick={() => onRemove(line.id)} aria-label={`Remove ${snapshot.title} from cart`} disabled={status === 'updating'}>
              <Icon name="trash" size="sm" />
              Remove
            </Button>
          </div>
        )}
      </div>

      {issue && (
        <div id={issueId} className={styles.issue}>
          <Icon name="alert-triangle" size="sm" />
          <p>
            <span className={styles.visuallyHidden}>Problem: </span>
            {issue.message}
          </p>
          {onSaveForLater && (
            <Button variant="secondary" size="sm" onClick={() => onSaveForLater(line.id)} aria-label={`Save for later: ${snapshot.title}`}>
              Save for later
            </Button>
          )}
        </div>
      )}

      <p className={styles.status} role="status">
        {status === 'updating' ? 'Updating…' : ''}
      </p>
      {status === 'error' && (
        <p className={styles.error} role="alert">
          <Icon name="alert-circle" size="sm" />
          We couldn’t update this item. Check your connection and try again.
        </p>
      )}
    </article>
  );
}
