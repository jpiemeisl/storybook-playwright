import { useCallback, useId, useRef, useState, type ComponentPropsWithRef, type FormEvent, type Ref } from 'react';
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { FieldSize } from '../Input';
import field from '../fieldBox.module.css';
import styles from './SearchInput.module.css';

/** Props for SearchInput. Other native `<input>` props go to the input; `className` goes on the form. */
export interface SearchInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue' | 'onChange'> {
  /**
   * Called with the trimmed query on Enter or the submit button; the native submit is prevented.
   * Optional when `action` is set: without it the form submits natively.
   */
  onSearch?: (query: string) => void;
  /**
   * Makes it a real GET form (works without JavaScript): submits to this URL with the input's `name`
   * (pass e.g. name="q"). `onSearch`, if also given, intercepts the submit instead.
   */
  action?: string;
  /** Controlled query. */
  value?: string;
  /** Uncontrolled initial query. */
  defaultValue?: string;
  /** Called with the raw (untrimmed) query on every change, including the clear button. */
  onChange?: (query: string) => void;
  /** Accessible label for the input and the search landmark. Visually hidden. Default "Search". */
  label?: string;
  /** Show a visible submit button (Enter always submits). */
  showSubmitButton?: boolean;
  /** Visual size of the box and the submit button. Default "md". */
  size?: FieldSize;
}

/** Points a caller's ref (callback or object) at the node; returns the callback ref's cleanup, if any. */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null): (() => void) | void {
  if (typeof ref === 'function') {
    const cleanup = ref(node);
    return typeof cleanup === 'function' ? cleanup : undefined;
  }
  if (ref) ref.current = node;
}

/**
 * <form role="search"> (a real GET form with `action`) with a search input, a leading icon and a
 * clear button that appears when there is text. Clearing returns focus to the input. No suggestions or autocomplete.
 */
export function SearchInput({
  onSearch,
  action,
  value,
  defaultValue = '',
  onChange,
  label = 'Search',
  showSubmitButton = false,
  size = 'md',
  id,
  className,
  ref,
  ...rest
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  // The clear button needs the input too, so keep the internal ref and forward to the caller's `ref`.
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      const cleanup = assignRef(ref, node);
      return () => {
        inputRef.current = null;
        if (cleanup) cleanup();
        else assignRef(ref, null);
      };
    },
    [ref],
  );
  const [internal, setInternal] = useState(defaultValue);
  const query = value ?? internal;

  const update = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const submit = (event: FormEvent) => {
    // A GET form without a handler submits natively; otherwise the handler takes over.
    if (action && !onSearch) return;
    event.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <form
      role="search"
      aria-label={label}
      action={action}
      method={action ? 'get' : undefined}
      onSubmit={submit}
      className={[styles.form, className].filter(Boolean).join(' ')}
    >
      <label htmlFor={inputId} className={styles.visuallyHidden}>
        {label}
      </label>
      <div className={[field.box, field[size], styles.box].join(' ')}>
        <Icon name="search" size="sm" className={styles.icon} />
        <input
          ref={setInputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => update(event.target.value)}
          className={[field.control, styles.input].join(' ')}
          {...rest}
        />
        {query && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={() => {
              update('');
              inputRef.current?.focus();
            }}
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
      {showSubmitButton && (
        <Button type="submit" size={size}>
          Search
        </Button>
      )}
    </form>
  );
}
