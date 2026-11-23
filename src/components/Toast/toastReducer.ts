/*
 * In-memory toast state for useToasts(). Pure: ids are supplied by the caller (useToasts uses a
 * counter), never generated from the clock or randomness.
 */
import type { ToastData } from './Toast';

/** State held by toastReducer: the current toasts. */
export interface ToastState {
  /** Oldest first. */
  toasts: ToastData[];
}

/**
 * Actions toastReducer accepts: `show` adds a toast (or replaces one with the same id), `dismiss`
 * removes one by id, `clear` removes all.
 */
export type ToastAction = { type: 'show'; toast: ToastData } | { type: 'dismiss'; id: string } | { type: 'clear' };

/** Most toasts kept in memory; the oldest are dropped first. */
export const TOAST_HISTORY_LIMIT = 20;

/** Empty toast state, the starting point for toastReducer. */
export const initialToastState: ToastState = { toasts: [] };

/**
 * Pure reducer for toast state, used by useToasts and usable with `useReducer` in a host app's own store.
 *
 * `show` with an existing id replaces that toast and moves it to the newest position; only the newest
 * TOAST_HISTORY_LIMIT toasts are kept. `dismiss` and `clear` return the same state object when nothing changes.
 */
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
