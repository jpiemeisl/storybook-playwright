import type { ImageContent } from '../../component-types/sections';
import { Image } from '../Image';
import { Link } from '../Link';
import styles from './SiteLogo.module.css';

/** Props for SiteLogo. */
export interface SiteLogoProps {
  /** Wordmark text; also the link's accessible name. */
  text: string;
  /** Usually "/". */
  href: string;
  /** Optional mark shown before the text. Decorative (the text names the link). */
  image?: ImageContent;
}

/** The site logo link for Header and Footer: an optional mark plus a text wordmark. */
export function SiteLogo({ text, href, image }: SiteLogoProps) {
  return (
    <Link href={href} unstyled className={styles.logo}>
      {image && <Image {...image} alt="" className={styles.mark} />}
      {text}
    </Link>
  );
}
