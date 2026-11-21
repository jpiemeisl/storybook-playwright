/*
 * In-memory toast state for useToasts(). Pure: ids are supplied by the caller (useToasts uses a
 * counter), never generated from the clock or randomness.
 */
import type { ToastData } from './Toast';

export interface ToastState {
  /** Oldest first. */
  toasts: ToastData[];
}

export type ToastAction = { type: 'show'; toast: ToastData } | { type: 'dismiss'; id: string } | { type: 'clear' };

/** Most toasts kept in memory; the oldest are dropped first. */
export const TOAST_HISTORY_LIMIT = 20;

export const initialToastState: ToastState = { toasts: [] };

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'show': {
      // Same id: replace in place and move to the newest position (e.g. "Cart updated" twice).
      const others = state.toasts.filter((t) => t.id !== action.toast.id);
      return { toasts: [...others, action.toast].slice(-TOAST_HISTORY_LIMIT) };
    }
    case 'dismiss': {
      const toasts = state.toasts.filter((t) => t.id !== action.id);
      return toasts.length === state.toasts.length ? state : { toasts };
    }
    case 'clear':
      return state.toasts.length ? initialToastState : state;
  }
}
