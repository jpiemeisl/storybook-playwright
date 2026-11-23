import { useId, useState, type ReactNode } from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { defaultConsentChoices, type ConsentCategory, type ConsentChoices } from './consent';
import styles from './CookieBanner.module.css';

/** Props for CookieBanner. The banner only reports choices through callbacks; the host app stores and applies them. */
export interface CookieBannerProps {
  /** Controlled: the host decides when to show it (e.g. no stored choice yet). */
  open: boolean;
  /** `bottom`: full width. `bottom-start`: a card in the start corner. Default `bottom`. */
  position?: 'bottom' | 'bottom-start';
  /** Names the region. Default "Cookies on this site". */
  title?: ReactNode;
  /** Explanation under the title, usually with a link to the cookie policy. */
  message: ReactNode;
  /** The categories shown in "Choose settings". Required ones are always on. */
  categories: ConsentCategory[];
  /** Starting choices in the settings dialog. Default defaultConsentChoices(categories). */
  initialChoices?: ConsentChoices;
  /** Banner "Accept all". */
  onAcceptAll: () => void;
  /**
   * "Reject all", from the banner or from the settings dialog (which closes first). The host app records
   * every optional category as off; `allConsentChoices(categories, false)` builds that value.
   */
  onRejectAll: () => void;
  /** Settings dialog "Save choices", with the choices as ticked. */
  onSave: (choices: ConsentChoices) => void;
  /** Adds a close button to the banner. What closing means (e.g. "decide later") is the host's call. */
  onClose?: () => void;
}

/**
 * UI only, and not legal advice. A non-modal, labeled region at the bottom of the viewport with
 * "Accept all" and "Reject all" given equal weight (same style, one tab stop each) and "Choose settings",
 * which opens a Modal with the categories. It never takes focus when it appears and never traps it; only
 * the settings dialog does, while open. It never reads or writes cookies or storage, loads no scripts and
 * gives the categories no meaning: the host stores the choice, applies it and owns compliance.
 * Stacking: above page content and sticky purchase bars (it sits on top of them), below toasts and dialogs.
 */
export function CookieBanner({ open, position = 'bottom', title = 'Cookies on this site', message, categories, initialChoices, onAcceptAll, onRejectAll, onSave, onClose }: CookieBannerProps) {
  const titleId = useId();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(() => initialChoices ?? defaultConsentChoices(categories));
  if (!open) return null;

  const openSettings = () => {
    setChoices(initialChoices ?? defaultConsentChoices(categories));
    setSettingsOpen(true);
  };
  const finish = (action: () => void) => {
    setSettingsOpen(false);
    action();
  };

  return (
    <section className={styles.banner} data-position={position} aria-labelledby={titleId} data-cookie-banner="">
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.message}>{message}</div>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onAcceptAll}>
          Accept all
        </Button>
        <Button variant="secondary" onClick={onRejectAll}>
          Reject all
        </Button>
        <Button variant="ghost" onClick={openSettings} aria-haspopup="dialog">
          Choose settings
        </Button>
      </div>
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close cookie banner">
          <Icon name="close" />
        </button>
      )}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Cookie settings"
        description="Choose which kinds of cookies this site may use. You can change this later."
        footer={
          <>
            <Button variant="secondary" onClick={() => finish(onRejectAll)}>
              Reject all
            </Button>
            <Button onClick={() => finish(() => onSave(choices))}>Save choices</Button>
          </>
        }
      >
        <ul className={styles.categories}>
          {categories.map((category) => (
            <li key={category.id}>
              <Checkbox
                name={`consent-${category.id}`}
                label={category.required ? `${category.label} (always on)` : category.label}
                description={category.description}
                checked={category.required ? true : !!choices[category.id]}
                disabled={category.required}
                onChange={(event) => setChoices({ ...choices, [category.id]: event.target.checked })}
              />
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
