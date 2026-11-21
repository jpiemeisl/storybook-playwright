import { describe, expect, it } from 'vitest';
import { initialToastState, TOAST_HISTORY_LIMIT, toastReducer, type ToastState } from './toastReducer';

const show = (state: ToastState, id: string, title = id) => toastReducer(state, { type: 'show', toast: { id, title } });

describe('toastReducer', () => {
  it('adds toasts oldest first', () => {
    const state = show(show(initialToastState, 'a'), 'b');
    expect(state.toasts.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('replaces a toast with the same id and moves it to the newest position', () => {
    const state = show(show(show(initialToastState, 'a'), 'b'), 'a', 'Again');
    expect(state.toasts.map((t) => [t.id, t.title])).toEqual([
      ['b', 'b'],
      ['a', 'Again'],
    ]);
  });

  it('dismisses by id and returns the same state for unknown ids', () => {
    const state = show(show(initialToastState, 'a'), 'b');
    expect(toastReducer(state, { type: 'dismiss', id: 'a' }).toasts.map((t) => t.id)).toEqual(['b']);
    expect(toastReducer(state, { type: 'dismiss', id: 'zzz' })).toBe(state);
  });

  it('clears everything', () => {
    expect(toastReducer(show(initialToastState, 'a'), { type: 'clear' })).toEqual(initialToastState);
    expect(toastReducer(initialToastState, { type: 'clear' })).toBe(initialToastState);
  });

  it(`keeps at most ${TOAST_HISTORY_LIMIT}, dropping the oldest`, () => {
    let state = initialToastState;
    for (let i = 1; i <= TOAST_HISTORY_LIMIT + 5; i++) state = show(state, `t${i}`);
    expect(state.toasts).toHaveLength(TOAST_HISTORY_LIMIT);
    expect(state.toasts[0]!.id).toBe('t6');
  });

  it('is JSON-safe for plain toasts and does not mutate', () => {
    const before = show(initialToastState, 'a');
    const frozen = JSON.parse(JSON.stringify(before)) as ToastState;
    show(before, 'b');
    expect(before).toEqual(frozen);
  });
});
