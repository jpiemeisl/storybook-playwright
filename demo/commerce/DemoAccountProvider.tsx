/*
 * DEMO ONLY. Storybook account provider: an in-memory customer with orders, subscriptions, invoices,
 * downloads, addresses and a wishlist. Actions go through the pure applyAccountAction (validated with
 * getSubscriptionActions, dated from a fixed demo now) and show a Toast. No storage, network or timers.
 */
import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useToasts, type ToastData } from '../../src/components/Toast';
import { accountData, customers, DEMO_NOW } from '../../src/commerce/fixtures';
import { applyAccountAction, createAccountReducer, type DemoAccountAction, type DemoAccountResult, type DemoAccountState } from './accountReducer';

export interface DemoAccount extends DemoAccountState {
  now: string;
  /** Performs an action; returns what happened (also shown as a Toast). */
  perform: (action: DemoAccountAction) => DemoAccountResult;
  toasts: ToastData[];
  dismissToast: (id: string) => void;
}

const DemoAccountContext = createContext<DemoAccount | null>(null);

export interface DemoAccountProviderProps {
  /** Which data set to start with. Default "rich". */
  data?: keyof typeof accountData;
  /** Signed out (customer null). */
  signedOut?: boolean;
  /** Simulate server errors for every action (story parameter demo.failAction). */
  failAction?: boolean;
  now?: string;
  children: ReactNode;
}

export function DemoAccountProvider({ data = 'rich', signedOut = false, failAction = false, now = DEMO_NOW, children }: DemoAccountProviderProps) {
  const ctx = useMemo(() => ({ now, fail: failAction }), [now, failAction]);
  const reducer = useMemo(() => createAccountReducer(ctx), [ctx]);
  const [state, dispatch] = useReducer(reducer, undefined, (): DemoAccountState => ({ customer: signedOut ? null : customers.robin, ...structuredClone(accountData[data]), nextAddress: 1, lastError: null }));
  const latest = useRef(state);
  latest.current = state;
  const { toasts, show, dismiss } = useToasts();

  const perform = useCallback(
    (action: DemoAccountAction) => {
      const { result } = applyAccountAction(latest.current, action, ctx);
      dispatch(action);
      show(result.ok ? { tone: 'success', title: result.message } : { tone: 'danger', title: 'That didn’t work', message: result.message });
      return result;
    },
    [ctx, show],
  );

  const value = useMemo<DemoAccount>(() => ({ ...state, now, perform, toasts, dismissToast: dismiss }), [state, now, perform, toasts, dismiss]);
  return <DemoAccountContext.Provider value={value}>{children}</DemoAccountContext.Provider>;
}

/** The demo account. Throws outside DemoAccountProvider. */
export function useDemoAccount(): DemoAccount {
  const value = useContext(DemoAccountContext);
  if (!value) throw new Error('useDemoAccount must be used inside <DemoAccountProvider>.');
  return value;
}
