import { useCallback, useMemo, useReducer, useRef } from 'react';
import type { ToastData } from './Toast';
import { initialToastState, toastReducer } from './toastReducer';

/** Return value of useToasts: the current toasts plus stable functions to change them. */
export interface UseToasts {
  /** Current toasts, oldest first. Pass to ToastRegion's `toasts`. */
  toasts: ToastData[];
  /** Shows a toast and returns its id ("toast-1", "toast-2", ... unless you pass one). */
  show: (toast: Omit<ToastData, 'id'> & { id?: string }) => string;
  /** Removes the toast with this id. Pass to ToastRegion's `onDismiss`. */
  dismiss: (id: string) => void;
  /** Removes every toast. */
  clear: () => void;
}

/**
 * Optional helper: toast state in memory (nothing persisted). Pass `toasts` and `dismiss` to
 * <ToastRegion toasts={toasts} onDismiss={dismiss} />.
 */
export function useToasts(): UseToasts {
  const [state, dispatch] = useReducer(toastReducer, initialToastState);
  const counter = useRef(0);
  const show = useCallback<UseToasts['show']>((toast) => {
    const id = toast.id ?? `toast-${++counter.current}`;
    dispatch({ type: 'show', toast: { ...toast, id } });
    return id;
  }, []);
  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  return useMemo(() => ({ toasts: state.toasts, show, dismiss, clear }), [state.toasts, show, dismiss, clear]);
}
