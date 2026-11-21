import type { TestimonialContent } from '../../component-types/sections';
import { Grid } from '../Grid';
import { Image } from '../Image';
import styles from './Testimonial.module.css';

export type TestimonialVariant = 'single' | 'card';

export interface TestimonialProps extends TestimonialContent {
  /** `single`: large pull quote. `card`: compact, for grids. */
  variant?: TestimonialVariant;
}

/** Quote with attribution, using <figure>/<blockquote>/<figcaption>. */
export function Testimonial({ quote, author, companyLogo, variant = 'single' }: TestimonialProps) {
  const role = [author.role, author.company].filter(Boolean).join(', ');
  return (
    <figure className={[styles.figure, styles[variant]].join(' ')}>
      {companyLogo && <Image {...companyLogo} className={styles.logo} />}
      <blockquote className={styles.quote}>{quote}</blockquote>
      <figcaption className={styles.caption}>
        {author.avatar && <Image {...author.avatar} alt="" className={styles.avatar} />}
        <span className={styles.attribution}>
          <span className={styles.name}>{author.name}</span>
          {role && <span className={styles.role}>{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export interface TestimonialGridProps {
  /** Two or three testimonials. */
  items: TestimonialContent[];
}

export function TestimonialGrid({ items }: TestimonialGridProps) {
  return (
    <Grid as="ul" columns={{ base: 1, md: Math.min(items.length, 3) }} gap="lg" className={styles.grid}>
      {items.map((item) => (
        <li key={item.author.name}>
          <Testimonial {...item} variant="card" />
        </li>
      ))}
    </Grid>
  );
}
