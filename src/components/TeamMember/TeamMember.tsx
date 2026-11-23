import type { TeamMemberContent } from '../../component-types/content';
import { initials } from '../AuthorByline';
import { Grid } from '../Grid';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Link } from '../Link';
import styles from './TeamMember.module.css';

/** Props for TeamMember: the TeamMemberContent fields plus presentation options. */
export interface TeamMemberProps extends TeamMemberContent {
  /** `card`: bordered with a large photo. `minimal`: small round photo beside the text. */
  variant?: 'card' | 'minimal';
  /** Heading level of the name. Default 3. */
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
            {social.map((link, index) => (
              <li key={`${link.platform}-${index}`}>
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

/** Props for TeamGrid. */
export interface TeamGridProps {
  /** People to show, in order. Names may repeat. */
  members: TeamMemberContent[];
  /** Columns on wide slots (2-4); steps down on narrower ones. */
  columns?: 2 | 3 | 4;
  /** TeamMember variant applied to every member. Default "card". */
  variant?: 'card' | 'minimal';
  /** Heading level of each name. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

/** Equal-height grid of TeamMember cards. */
export function TeamGrid({ members, columns = 3, variant = 'card', headingLevel = 3 }: TeamGridProps) {
  return (
    <Grid as="ul" columns={{ base: 1, sm: 2, md: Math.min(columns, 3), lg: columns }} gap="lg" className={styles.grid}>
      {members.map((member, index) => (
        <li key={`${member.name}-${index}`}>
          <TeamMember {...member} variant={variant} headingLevel={headingLevel} />
        </li>
      ))}
    </Grid>
  );
}
