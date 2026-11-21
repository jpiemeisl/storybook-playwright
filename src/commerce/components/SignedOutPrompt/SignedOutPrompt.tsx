import { ButtonLink } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import styles from './SignedOutPrompt.module.css';

export interface SignedOutPromptProps {
  /** e.g. "Sign in to view your orders". Default "Sign in to see your account". */
  title?: string;
  links?: { signIn?: string; register?: string };
  headingLevel?: 2 | 3;
}

/** For account pages rendered without a customer: an EmptyState with Sign in and Create account. */
export function SignedOutPrompt({ title = 'Sign in to see your account', links = {}, headingLevel = 2 }: SignedOutPromptProps) {
  return (
    <EmptyState title={title} message="Your orders, downloads and subscriptions are here once you’re signed in." headingLevel={headingLevel}>
      <div className={styles.actions}>
        <ButtonLink href={links.signIn ?? '/account/login'}>Sign in</ButtonLink>
        <ButtonLink href={links.register ?? '/account/register'} variant="secondary">
          Create an account
        </ButtonLink>
      </div>
    </EmptyState>
  );
}
