import type { Address } from '../../types/order';
import styles from './AddressBlock.module.css';

/** A US address as lines: name, company, street, "City, ST 97201", country, phone. Shared by checkout and confirmation. */
export function AddressBlock({ address }: { address: Address }) {
  const lines = [
    address.name,
    address.company,
    address.line1,
    address.line2,
    `${address.city}, ${address.region ?? ''} ${address.postalCode}`.replace(/\s+/g, ' '),
    address.country === 'US' ? 'United States' : address.country,
    address.phone,
  ].filter(Boolean);
  return (
    <address className={styles.address}>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </address>
  );
}
