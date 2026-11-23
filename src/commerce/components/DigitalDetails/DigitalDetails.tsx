import { Icon } from '../../../components/Icon';
import { formatBytes } from '../../logic/options';
import type { DigitalDelivery } from '../../types/product';
import styles from './DigitalDetails.module.css';

const licenseNames = { single: 'Single-user license', team: 'Team license', unlimited: 'Unlimited license' } as const;

/** Compact file list (name, format, size) and license summary for digital products. */
export function DigitalDetails({ digital }: { digital?: DigitalDelivery }) {
  if (!digital) return null;
  return (
    <div className={styles.root}>
      <ul className={styles.files} aria-label="Files included">
        {digital.files.map((file) => (
          <li key={file.id} className={styles.file}>
            <Icon name="download" size="sm" className={styles.icon} />
            <span className={styles.name}>{file.name}</span>
            <span className={styles.meta}>
              {file.format} · {formatBytes(file.sizeBytes)}
            </span>
          </li>
        ))}
      </ul>
      {digital.licence && (
        <p className={styles.licence}>
          <Icon name="shield" size="sm" className={styles.icon} />
          <span>
            <strong>{licenseNames[digital.licence.type]}.</strong> {digital.licence.summary}
          </span>
        </p>
      )}
    </div>
  );
}
