import type { MouseEvent } from 'react';
import { Button, ButtonLink } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { formatCommerceDate } from '../../logic/pricing';
import { formatBytes } from '../../logic/options';
import type { Order } from '../../types/order';
import styles from './DownloadList.module.css';

export type DownloadItem = NonNullable<Order['downloads']>[number];

export interface DownloadListProps {
  downloads: DownloadItem[];
  /**
   * Download URL for a file. Default "#": a placeholder for demos and stories that does not navigate.
   * Hosts pass signed URLs from their order API.
   */
  hrefFor?: (download: DownloadItem) => string;
  /** Shown for files that are not available yet. Default "Available once your payment is confirmed." */
  unavailableReason?: string;
}

/** Placeholder links never navigate. */
const stayPut = (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.currentTarget.getAttribute('href') === '#') event.preventDefault();
};

/**
 * Files with name, format and size, and a Download link. Unavailable files show a focusable disabled
 * button with the reason as text. Expiry comes from the data ("Link expires Mar 21, 2027"), never the clock.
 */
export function DownloadList({ downloads, hrefFor = () => '#', unavailableReason = 'Available once your payment is confirmed.' }: DownloadListProps) {
  return (
    <ul className={styles.root}>
      {downloads.map((file) => {
        const reasonId = `download-${file.fileId}-reason`;
        const meta = [file.format, file.sizeBytes !== undefined ? formatBytes(file.sizeBytes) : undefined].filter(Boolean).join(' · ');
        return (
          <li key={file.fileId} className={styles.item}>
            <Icon name="download" className={styles.icon} />
            <div className={styles.text}>
              <p className={styles.name}>{file.name}</p>
              {meta && <p className={styles.meta}>{meta}</p>}
              {file.expiresAt && <p className={styles.meta}>Link expires {formatCommerceDate(file.expiresAt)}</p>}
              {!file.available && (
                <p id={reasonId} className={styles.reason}>
                  {unavailableReason}
                </p>
              )}
            </div>
            {file.available ? (
              <ButtonLink href={hrefFor(file)} variant="secondary" size="sm" onClick={stayPut} aria-label={`Download ${file.name}`}>
                Download
              </ButtonLink>
            ) : (
              <Button variant="secondary" size="sm" aria-disabled="true" aria-describedby={reasonId} aria-label={`Download ${file.name}`} onClick={(e) => e.preventDefault()}>
                Download
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
