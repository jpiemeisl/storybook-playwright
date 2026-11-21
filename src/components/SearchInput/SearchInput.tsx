import { useId, useRef, useState, type ComponentPropsWithRef, type FormEvent } from 'react';
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { FieldSize } from '../Input';
import field from '../fieldBox.module.css';
import styles from './SearchInput.module.css';

export interface SearchInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue' | 'onChange'> {
  /** Called with the trimmed query on Enter or the submit button. */
  onSearch: (query: string) => void;
  /** Controlled query. */
  value?: string;
  /** Uncontrolled initial query. */
  defaultValue?: string;
  onChange?: (query: string) => void;
  /** Accessible label for the input and the search landmark. Visually hidden. Default "Search". */
  label?: string;
  /** Show a visible submit button (Enter always submits). */
  showSubmitButton?: boolean;
  size?: FieldSize;
}

/**
 * <form role="search"> with a search input, a leading icon and a clear button that appears when there
 * is text. Clearing returns focus to the input. No suggestions or autocomplete.
 */
export function SearchInput({
  onSearch,
  value,
  defaultValue = '',
  onChange,
  label = 'Search',
  showSubmitButton = false,
  size = 'md',
  id,
  className,
  ...rest
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const query = value ?? internal;

  const update = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form role="search" aria-label={label} onSubmit={submit} className={[styles.form, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.visuallyHidden}>
        {label}
      </label>
      <div className={[field.box, field[size], styles.box].join(' ')}>
        <Icon name="search" size="sm" className={styles.icon} />
        <input
          ref={inputRef}
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
