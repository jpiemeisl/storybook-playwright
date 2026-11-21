import type { ActionLink } from '../content-types/sections';
import { ButtonLink } from './Button';
import { Stack } from './Stack';

/* Internal: one or two link actions rendered as buttons (first primary, second secondary). */
export function ActionGroup({
  actions,
  justify = 'start',
  className,
}: {
  actions: (ActionLink | undefined)[];
  justify?: 'start' | 'center';
  className?: string;
}) {
  const present = actions.filter((action): action is ActionLink => !!action).slice(0, 2);
  if (present.length === 0) return null;
  return (
    <Stack direction="row" gap="sm" wrap justify={justify} className={className}>
      {present.map((action, index) => (
        <ButtonLink key={action.href + action.label} href={action.href} variant={index === 0 ? 'primary' : 'secondary'} size="lg">
          {action.label}
        </ButtonLink>
      ))}
    </Stack>
  );
}
