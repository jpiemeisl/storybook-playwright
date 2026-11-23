import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import styles from './PromoCodeInput.module.css';

/** What onApply reports back. A promise shows the "applying" state until it settles. */
export type PromoApplyResult = { ok: boolean; message: string };

/** Props for PromoCodeInput, the promo code form with applied codes as chips. */
export interface PromoCodeInputProps {
  /** Codes already applied, shown as chips. */
  applied: string[];
  /** Called with the trimmed code. Return (or resolve) a result to show success or the error message. */
  onApply: (code: string) => PromoApplyResult | Promise<PromoApplyResult> | void;
  /** Shows a remove button on each chip. */
  onRemove?: (code: string) => void;
  /** Forces a state, e.g. for a server round trip the host tracks itself. */
  status?: 'idle' | 'applying' | 'error';
  /** Message for a forced `error` status. */
  message?: string;
  /** Form action for the no-JavaScript fallback (field name "promo"). Default "" (the current URL). */
  action?: string;
}

/**
 * Promo code field and Apply button, with applied codes as removable chips. A real form (POST, field
 * "promo") so it works without JavaScript; with JavaScript, onApply handles it. Results are announced
 * politely. Codes are shown uppercased; the value passed on is only trimmed.
 */
export function PromoCodeInput({ applied, onApply, onRemove, status, message, action = '' }: PromoCodeInputProps) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'applying' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [announcement, setAnnouncement] = useState('');
  const current = status ?? state.status;
  const error = current === 'error' ? (status ? message : state.message) : undefined;

  const finish = (result: PromoApplyResult | void) => {
    if (!result) return setState({ status: 'idle', message: '' });
    setAnnouncement(result.message);
    if (result.ok) setDraft('');
    setState(result.ok ? { status: 'idle', message: '' } : { status: 'error', message: result.message });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (current === 'applying') return;
    const code = draft.trim();
    if (!code) {
      setAnnouncement('Enter a promo code.');
      return setState({ status: 'error', message: 'Enter a promo code.' });
    }
    const result = onApply(code);
    if (result instanceof Promise) {
      setState({ status: 'applying', message: '' });
      setAnnouncement('Applying code…');
      result.then(finish, () => finish({ ok: false, message: 'The code could not be checked. Try again.' }));
    } else finish(result);
  };

  return (
    <div className={styles.root}>
      <form method="post" action={action} noValidate onSubmit={submit} className={styles.form}>
        <Field id={id} label="Promo code" error={error}>
          <Input name="promo" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={draft} onChange={(e) => setDraft(e.target.value)} className={styles.input} />
        </Field>
        <Button type="submit" variant="secondary" loading={current === 'applying'} className={styles.apply}>
          Apply
        </Button>
      </form>
      {applied.length > 0 && (
        <ul className={styles.chips} aria-label="Applied promo codes">
          {applied.map((code) => (
            <li key={code} className={styles.chip}>
              <Icon name="tag" size="sm" />
              <span>{code.toUpperCase()}</span>
              {onRemove && (
                <button type="button" className={styles.chipRemove} onClick={() => onRemove(code)} aria-label={`Remove promo code ${code.toUpperCase()}`}>
                  <Icon name="close" size="sm" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <span role="status" className={styles.visuallyHidden}>
        {announcement}
      </span>
    </div>
  );
}
