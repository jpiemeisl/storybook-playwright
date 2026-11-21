import type { TeamMemberContent } from '../../component-types/content';
import { initials } from '../AuthorByline';
import { Grid } from '../Grid';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Link } from '../Link';
import styles from './TeamMember.module.css';

export interface TeamMemberProps extends TeamMemberContent {
  /** `card`: bordered with a large photo. `minimal`: small round photo beside the text. */
  variant?: 'card' | 'minimal';
  headingLevel?: 2 | 3 | 4;
}

/** One person: photo (or initials), name, role, short bio and optional social links. */
export function TeamMember({ name, role, photo, bio, social = [], variant = 'card', headingLevel = 3 }: TeamMemberProps) {
  const H = `h${headingLevel}` as const;
  return (
    <article className={[styles.member, styles[variant]].join(' ')}>
      {photo ? (
        <Image {...photo} alt="" aspectRatio={variant === 'card' ? '1 / 1' : undefined} className={styles.photo} />
      ) : (
        <span className={[styles.photo, styles.initials].join(' ')} aria-hidden="true">
          {initials(name)}
        </span>
      )}
      <div className={styles.text}>
        <H className={styles.name}>{name}</H>
        {role && <p className={styles.role}>{role}</p>}
        {bio && <div className={styles.bio}>{bio}</div>}
        {social.length > 0 && (
          <ul className={styles.social}>
            {social.map((link) => (
              <li key={link.platform}>
                <Link href={link.href} aria-label={link.label} externalIcon={false} unstyled className={styles.socialLink}>
                  <Icon name={link.platform} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export interface TeamGridProps {
  members: TeamMemberContent[];
  /** Columns on wide slots (2-4); steps down on narrower ones. */
  columns?: 2 | 3 | 4;
  variant?: 'card' | 'minimal';
  headingLevel?: 2 | 3 | 4;
}

/** Equal-height grid of TeamMember cards. */
export function TeamGrid({ members, columns = 3, variant = 'card', headingLevel = 3 }: TeamGridProps) {
  return (
    <Grid as="ul" columns={{ base: 1, sm: 2, md: Math.min(columns, 3), lg: columns }} gap="lg" className={styles.grid}>
      {members.map((member) => (
        <li key={member.name}>
          <TeamMember {...member} variant={variant} headingLevel={headingLevel} />
        </li>
      ))}
    </Grid>
  );
}
