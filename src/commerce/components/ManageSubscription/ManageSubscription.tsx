import { useEffect, useId, useState, type ReactNode } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Icon } from '../../../components/Icon';
import { Modal } from '../../../components/Modal';
import { Radio, RadioGroup } from '../../../components/Radio';
import { Textarea } from '../../../components/Textarea';
import { computePauseResumeDate, getPlanChangeSummary, getSubscriptionActions, type PauseMonths, type SubscriptionAction } from '../../logic/account';
import { formatCommerceDate, formatRecurring } from '../../logic/pricing';
import type { PlanChangeEffective } from '../../types/account';
import type { CustomerSubscription } from '../../types/order';
import styles from './ManageSubscription.module.css';

/** What the customer asked for. The host performs it and reports back through `status`. */
export type SubscriptionActionRequest =
  | { type: 'pause'; months: PauseMonths; resumesOn: string }
  | { type: 'resume' }
  | { type: 'change-plan'; planId: string; effective: PlanChangeEffective }
  | { type: 'cancel'; reason?: string; comment?: string }
  | { type: 'undo-cancel' }
  | { type: 'reactivate' }
  | { type: 'update-payment' };

/** Props for ManageSubscription, the subscription action buttons and their confirmation dialogs (pause, change plan, cancel and so on). */
export interface ManageSubscriptionProps {
  subscription: CustomerSubscription;
  /** ISO 8601 "now", for pause resume dates. */
  now: string;
  /**
   * Performs an action. Synchronous hosts just update their data; async hosts set `status` to
   * `submitting` before returning, then `idle` (done) or `error`. A dialog closes when the status is
   * `idle` after its request, and stays open with `errorMessage` on `error`.
   */
  onAction: (request: SubscriptionActionRequest) => void;
  /** State of the host's last action request; see `onAction`. */
  status?: 'idle' | 'submitting' | 'error';
  /** Shown in the open dialog when `status` is `error`. */
  errorMessage?: string;
  /** What happens to digital access when cancelled, from your data (shown in the cancel dialog). */
  accessNote?: string;
}

type Dialog = Exclude<SubscriptionAction, 'update-payment'> | null;

const labels: Record<SubscriptionAction, string> = {
  pause: 'Pause',
  resume: 'Resume',
  'change-plan': 'Change plan',
  cancel: 'Cancel subscription',
  'undo-cancel': 'Keep my subscription',
  'update-payment': 'Update payment method',
  reactivate: 'Reactivate',
};

const REASONS = ['It costs too much', 'I’m not using it enough', 'It’s missing something I need', 'I’m switching to something else', 'Another reason'];

/**
 * The subscription's action area, driven by getSubscriptionActions. Each action opens a Modal (native
 * dialog: focus trap, Escape, focus returns to the button): pause (1-3 months with the resume date),
 * change plan (radio cards, current disabled, the change summary before confirming), cancel (what
 * happens, optional reason and comment; "Keep subscription" has focus first; a destructive confirm
 * marked by icon and border, not colour alone), resume, undo cancellation and reactivate. Update payment
 * method is a callback only. Outcomes are announced politely.
 */
export function ManageSubscription({ subscription: sub, now, onAction, status = 'idle', errorMessage, accessNote }: ManageSubscriptionProps) {
  const id = useId();
  const actions = getSubscriptionActions(sub);
  const [open, setOpen] = useState<Dialog>(null);
  const [pending, setPending] = useState<SubscriptionActionRequest | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [months, setMonths] = useState<PauseMonths>(1);
  const current = sub.availablePlans?.find((p) => p.current);
  const [planId, setPlanId] = useState(current?.id ?? '');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const periodEnd = sub.currentPeriodEnd ?? sub.trialEndsAt ?? sub.nextBillingAt;

  // A request finished when the host is idle again: close the dialog and announce the outcome.
  useEffect(() => {
    if (!pending || status !== 'idle') return;
    setAnnouncement(outcome(pending, sub));
    setPending(null);
    setOpen(null);
  }, [pending, status, sub]);

  const request = (r: SubscriptionActionRequest) => {
    setPending(r);
    onAction(r);
  };
  const busy = status === 'submitting';
  const error = pending && status === 'error' ? <Alert tone="danger" urgent title="That didn’t work">{errorMessage ?? 'Nothing has changed. Try again in a moment.'}</Alert> : null;

  const confirm = (label: string, r: () => SubscriptionActionRequest, disabled = false) => (
    <Button loading={busy} aria-disabled={disabled || undefined} onClick={() => !disabled && request(r())}>
      {label}
    </Button>
  );
  const close = () => {
    if (!busy) {
      setOpen(null);
      setPending(null);
    }
  };

  const nextPlan = sub.availablePlans?.find((p) => p.id === planId);
  const summary = current && nextPlan && !nextPlan.current ? getPlanChangeSummary(current, nextPlan, { effective: sub.planChangeEffective, nextBillingAt: sub.nextBillingAt }) : null;

  const dialogs: Record<Exclude<Dialog, null>, { title: string; body: ReactNode; footer: ReactNode }> = {
    pause: {
      title: `Pause ${sub.productTitle}`,
      body: (
        <RadioGroup legend="Pause for" name={`${id}-months`} value={String(months)} onChange={(v) => setMonths(Number(v) as PauseMonths)}>
          {([1, 2, 3] as const).map((m) => (
            <Radio key={m} value={String(m)} label={`${m} ${m === 1 ? 'month' : 'months'}`} description={`Resumes on ${formatCommerceDate(computePauseResumeDate(now, m))}`} />
          ))}
        </RadioGroup>
      ),
      footer: confirm('Pause subscription', () => ({ type: 'pause', months, resumesOn: computePauseResumeDate(now, months) })),
    },
    'change-plan': {
      title: 'Change plan',
      body: (
        <>
          <RadioGroup legend="Choose a plan" name={`${id}-plan`} variant="card" value={planId} onChange={setPlanId}>
            {(sub.availablePlans ?? []).map((p) => (
              <Radio key={p.id} value={p.id} disabled={p.current} label={`${p.name}: ${formatRecurring(p.price, p.interval)}${p.current ? ' (Current plan)' : ''}`} description={p.features.join(' · ')} />
            ))}
          </RadioGroup>
          <p className={styles.summary} role="status">
            {summary ? `${summary.direction === 'upgrade' ? 'Upgrade' : summary.direction === 'downgrade' ? 'Downgrade' : 'Switch'}. ${summary.effectiveText}` : 'Choose a plan to see what changes.'}
          </p>
        </>
      ),
      footer: confirm('Change plan', () => ({ type: 'change-plan', planId, effective: sub.planChangeEffective ?? 'next-billing-date' }), !summary),
    },
    cancel: {
      title: `Cancel ${sub.productTitle}?`,
      body: (
        <>
          <ul className={styles.facts}>
            <li>{periodEnd ? `You keep access until ${formatCommerceDate(periodEnd)}.` : 'You keep access until the end of this period.'}</li>
            <li>Renewal stops: you won’t be charged again.</li>
            {accessNote && <li>{accessNote}</li>}
            <li>You can undo this any time before {periodEnd ? formatCommerceDate(periodEnd) : 'the period ends'}.</li>
          </ul>
          <RadioGroup legend="Why are you cancelling? (optional)" name={`${id}-reason`} value={reason} onChange={setReason}>
            {REASONS.map((r) => (
              <Radio key={r} value={r} label={r} />
            ))}
          </RadioGroup>
          <Field id={`${id}-comment`} label="Anything else? (optional)">
            <Textarea name="comment" rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
        </>
      ),
      footer: (
        <>
          <Button variant="secondary" ref={(el) => el?.setAttribute('autofocus', '')} onClick={close}>
            Keep subscription
          </Button>
          <Button variant="secondary" className={styles.destructive} loading={busy} onClick={() => request({ type: 'cancel', ...(reason ? { reason } : {}), ...(comment.trim() ? { comment: comment.trim() } : {}) })}>
            <Icon name="close" size="sm" />
            Cancel subscription
          </Button>
        </>
      ),
    },
    resume: { title: `Resume ${sub.productTitle}?`, body: <p>Billing restarts today and your next delivery is scheduled as normal.</p>, footer: confirm('Resume now', () => ({ type: 'resume' })) },
    'undo-cancel': { title: 'Keep your subscription?', body: <p>Your subscription continues and renews as usual{sub.nextBillingAt ? ` on ${formatCommerceDate(sub.nextBillingAt)}` : ''}.</p>, footer: confirm('Keep my subscription', () => ({ type: 'undo-cancel' })) },
    reactivate: { title: `Reactivate ${sub.productTitle}?`, body: <p>You’ll be charged {formatRecurring(sub.price, sub.interval)} starting today, on your {sub.plan.toLowerCase()} plan.</p>, footer: confirm('Reactivate', () => ({ type: 'reactivate' })) },
  };
  const dialog = open ? dialogs[open] : null;

  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        {actions.map((action) =>
          action === 'update-payment' ? (
            <Button key={action} variant={sub.status === 'past-due' ? 'primary' : 'secondary'} onClick={() => onAction({ type: 'update-payment' })}>
              <Icon name="credit-card" size="sm" />
              {labels[action]}
            </Button>
          ) : (
            <Button key={action} variant={action === 'cancel' ? 'ghost' : 'secondary'} aria-haspopup="dialog" onClick={() => setOpen(action)}>
              {labels[action]}
            </Button>
          ),
        )}
      </div>
      <p role="status" className={styles.announcement}>
        {announcement}
      </p>
      <Modal open={!!dialog} onClose={close} title={dialog?.title ?? ''} footer={dialog ? <div className={styles.footer}>{dialog.footer}</div> : undefined}>
        {dialog && (
          <div className={styles.body}>
            {error}
            {dialog.body}
          </div>
        )}
      </Modal>
    </div>
  );
}

/** The polite announcement after a request succeeds. */
function outcome(r: SubscriptionActionRequest, sub: CustomerSubscription): string {
  switch (r.type) {
    case 'pause':
      return `${sub.productTitle} is paused until ${formatCommerceDate(r.resumesOn)}.`;
    case 'resume':
      return `${sub.productTitle} is active again.`;
    case 'change-plan':
      return r.effective === 'immediately' ? `${sub.productTitle} plan changed.` : `Plan change scheduled for ${sub.productTitle}${sub.nextBillingAt ? ` on ${formatCommerceDate(sub.nextBillingAt)}` : ''}.`;
    case 'cancel':
      return `${sub.productTitle} will be cancelled at the end of this period.`;
    case 'undo-cancel':
      return `${sub.productTitle} will keep renewing.`;
    case 'reactivate':
      return `${sub.productTitle} is active again.`;
    case 'update-payment':
      return '';
  }
}
