import { Container } from '../../../components/Container';
import { Heading } from '../../../components/Heading';
import type { PageContent } from '../../../content-types/blocks';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { ForgotPasswordForm } from '../../components/ForgotPasswordForm';
import { LoginForm } from '../../components/LoginForm';
import { RegisterForm } from '../../components/RegisterForm';
import { ResetPasswordForm } from '../../components/ResetPasswordForm';
import type { AuthPage, AuthTemplateName } from '../../types/account-pages';
import type { CommerceContext } from '../../types/context';
import styles from './AuthTemplate.module.css';

const AUTH: AuthTemplateName[] = ['login', 'register', 'forgot-password', 'reset-password'];
export const canRenderAuth = (page: PageContent) => AUTH.includes(page.template as AuthTemplateName);

const copy: Record<AuthTemplateName, { title: string; intro: string }> = {
  login: { title: 'Sign in', intro: 'Welcome back. Sign in to see your orders, downloads and subscriptions.' },
  register: { title: 'Create an account', intro: 'Track orders, download your files and manage subscriptions in one place.' },
  'forgot-password': { title: 'Reset your password', intro: '' },
  'reset-password': { title: 'Choose a new password', intro: '' },
};

/**
 * Sign in, create account, forgot password and reset password: the minimal site layout by default
 * (page.layout "default" for the full one), a centred card with the h1 and the form. Forms POST to
 * page.action without JavaScript; ctx.onLogin and friends take over when given. ctx.formHiddenFields
 * goes into every form (CSRF tokens, the reset token).
 */
export function AuthTemplate({ page, chrome, ctx }: TemplateProps<AuthPage> & { ctx?: CommerceContext }) {
  const { template, action = '', status = 'idle', errorMessage, links = {} } = page;
  const base = { action, hiddenFields: ctx?.formHiddenFields, status, ...(errorMessage ? { errorMessage } : {}) };
  const { title, intro } = copy[template];
  const form = {
    login: <LoginForm {...base} onSubmit={ctx?.onLogin} links={{ forgotPassword: links.forgotPassword ?? '/account/forgot-password', register: links.register ?? '/account/register' }} />,
    register: <RegisterForm {...base} onSubmit={ctx?.onRegister} links={{ signIn: links.login ?? '/account/login', terms: links.terms, privacy: links.privacy }} />,
    'forgot-password': <ForgotPasswordForm {...base} onSubmit={ctx?.onForgotPassword} email={page.email} links={{ signIn: links.login ?? '/account/login' }} />,
    'reset-password': <ResetPasswordForm {...base} onSubmit={ctx?.onResetPassword} expired={page.expired} links={{ signIn: links.login ?? '/account/login', forgotPassword: links.forgotPassword ?? '/account/forgot-password' }} />,
  }[template];

  return (
    <SiteLayout chrome={chrome} variant={page.layout ?? 'minimal'} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="sm">
          <div className={styles.card}>
            <Heading as="h1" size="2xl">
              {title}
            </Heading>
            {intro && <p className={styles.intro}>{intro}</p>}
            {form}
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}
