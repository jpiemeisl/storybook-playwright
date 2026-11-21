import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type CSSProperties } from 'react';
import field from '../fieldBox.module.css';
import styles from './Textarea.module.css';

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  /** Grow with the content (CSS field-sizing). Browsers without it keep `rows` and a resize handle. */
  autoGrow?: boolean;
  /** Show "used / maxLength" under the field. Requires `maxLength`. */
  showCount?: boolean;
}

const ANNOUNCE_DELAY_MS = 1000;

/**
 * Multi-line text. The optional counter is visual only (aria-hidden); screen readers get the limit
 * via aria-describedby and a polite live region that is updated once typing pauses for a second,
 * so the remaining count is not announced on every keystroke.
 */
export function Textarea({
  autoGrow = false,
  showCount = false,
  rows = 4,
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  style,
  'aria-describedby': describedBy,
  ...rest
}: TextareaProps) {
  const limitId = useId();
  const [uncontrolledLength, setUncontrolledLength] = useState(() => String(defaultValue ?? '').length);
  const length = value !== undefined ? String(value).length : uncontrolledLength;
  const [announcement, setAnnouncement] = useState('');
  const typed = useRef(false);
  const counting = showCount && maxLength !== undefined;

  useEffect(() => {
    if (!counting || !typed.current) return;
    const timer = setTimeout(() => setAnnouncement(`${maxLength - length} characters remaining`), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [counting, length, maxLength]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    typed.current = true;
    setUncontrolledLength(event.target.value.length);
    onChange?.(event);
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div className={[field.box, styles.box].join(' ')}>
        <textarea
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={[field.control, styles.textarea, autoGrow && styles.autoGrow].filter(Boolean).join(' ')}
          style={{ '--rows': rows, ...style } as CSSProperties}
          aria-describedby={[describedBy, counting ? limitId : undefined].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
      </div>
      {counting && (
        <div className={styles.counter}>
          <span aria-hidden="true">
            {length.toLocaleString('en-US')} / {maxLength.toLocaleString('en-US')}
          </span>
          <span id={limitId} className={styles.visuallyHidden}>
            Up to {maxLength.toLocaleString('en-US')} characters.
          </span>
          <span className={styles.visuallyHidden} aria-live="polite">
            {announcement}
          </span>
        </div>
      )}
    </div>
  );
}
