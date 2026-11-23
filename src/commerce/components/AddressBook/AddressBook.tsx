import { useEffect, useId, useRef, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Field } from '../../../components/Field';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { MAX_ADDRESSES, type AddressKind } from '../../logic/account';
import { validateUsAddress } from '../../logic/checkout';
import type { SavedAddress } from '../../types/account';
import type { Address } from '../../types/order';
import { AddressBlock } from '../AddressBlock';
import { AddressForm } from '../AddressForm';
import styles from './AddressBook.module.css';

/** Props for AddressBook, the saved address cards with add, edit, delete and make-default; the host owns the data and applies each change. */
export interface AddressBookProps {
  addresses: SavedAddress[];
  /** Add (no id) or update (with id) an address. */
  onSave: (address: Omit<SavedAddress, 'id'> & { id?: string }) => void;
  /** Deletes an address after the customer confirms. Use removeAddress to keep the defaults set. */
  onDelete: (id: string) => void;
  /** Makes an address the only default of `kind`; setDefaultAddress does this for an address array. */
  onSetDefault: (id: string, kind: AddressKind) => void;
  /** Error from the host's last change, shown in the open dialog. */
  errorMessage?: string;
  /** Default MAX_ADDRESSES (10). */
  maxAddresses?: number;
}

type Editing = { id?: string; label: string; address: Partial<Address> };

const nameOf = (a: SavedAddress) => a.label || a.name;

/**
 * Address cards with labels and "Default shipping" / "Default billing" badges (text), Edit (a Modal
 * with AddressForm and a label), Delete (a confirmation Modal), "Make default" buttons on the others,
 * and "Add address" up to the limit. Changes are announced in a polite live region; focus returns to
 * the button that opened a dialog, or to "Add address" when the address it belonged to was deleted.
 */
export function AddressBook({ addresses, onSave, onDelete, onSetDefault, errorMessage, maxAddresses = MAX_ADDRESSES }: AddressBookProps) {
  const id = useId();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [refocusAdd, setRefocusAdd] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  const full = addresses.length >= maxAddresses;

  useEffect(() => {
    if (refocusAdd && !deleting) {
      addRef.current?.focus();
      setRefocusAdd(false);
    }
  }, [refocusAdd, deleting]);

  const save = () => {
    if (!editing) return;
    const found = validateUsAddress(editing.address, 'shippingAddress');
    setErrors(found);
    if (Object.keys(found).length) return;
    const existing = addresses.find((a) => a.id === editing.id);
    onSave({ ...existing, ...(editing.address as Address), country: 'US', ...(editing.label.trim() ? { label: editing.label.trim() } : { label: undefined }), ...(editing.id ? { id: editing.id } : {}) });
    setAnnouncement(editing.id ? `Saved changes to ${editing.label || editing.address.name}.` : `Added ${editing.label || editing.address.name}.`);
    setEditing(null);
  };

  const remove = () => {
    if (!deleting) return;
    onDelete(deleting.id);
    setAnnouncement(`Deleted ${nameOf(deleting)}.`);
    setDeleting(null);
    setRefocusAdd(true);
  };

  const makeDefault = (a: SavedAddress, kind: AddressKind) => {
    onSetDefault(a.id, kind);
    setAnnouncement(`${nameOf(a)} is now your default ${kind} address.`);
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Button ref={addRef} variant="secondary" onClick={() => !full && (setErrors({}), setEditing({ label: '', address: { country: 'US' } }))} aria-disabled={full || undefined} aria-describedby={full ? `${id}-limit` : undefined}>
          <Icon name="plus" size="sm" />
          Add address
        </Button>
        {full && (
          <p id={`${id}-limit`} className={styles.limit}>
            You can save up to {maxAddresses} addresses. Delete one to add another.
          </p>
        )}
      </div>
      <p role="status" className={styles.announcement}>
        {announcement}
      </p>

      {addresses.length === 0 ? (
        <EmptyState title="No saved addresses" message="Save an address to check out faster next time." />
      ) : (
        <ul className={styles.list}>
          {addresses.slice(0, maxAddresses).map((a) => (
            <li key={a.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.title}>{nameOf(a)}</h2>
                <div className={styles.badges}>
                  {a.isDefaultShipping && (
                    <Badge size="sm" tone="success">
                      <Icon name="truck" size="sm" /> Default shipping
                    </Badge>
                  )}
                  {a.isDefaultBilling && (
                    <Badge size="sm" tone="success">
                      <Icon name="receipt" size="sm" /> Default billing
                    </Badge>
                  )}
                </div>
              </div>
              <AddressBlock address={a} />
              <div className={styles.actions}>
                <Button size="sm" variant="secondary" aria-label={`Edit ${nameOf(a)}`} onClick={() => (setErrors({}), setEditing({ id: a.id, label: a.label ?? '', address: a }))}>
                  <Icon name="pencil" size="sm" /> Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${nameOf(a)}`} onClick={() => setDeleting(a)}>
                  <Icon name="trash" size="sm" /> Delete
                </Button>
                {!a.isDefaultShipping && (
                  <Button size="sm" variant="ghost" aria-label={`Make default for shipping: ${nameOf(a)}`} onClick={() => makeDefault(a, 'shipping')}>
                    Make default for shipping
                  </Button>
                )}
                {!a.isDefaultBilling && (
                  <Button size="sm" variant="ghost" aria-label={`Make default for billing: ${nameOf(a)}`} onClick={() => makeDefault(a, 'billing')}>
                    Make default for billing
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.label || editing.address.name || 'address'}` : 'Add an address'}
        size="lg"
        footer={
          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save address</Button>
          </div>
        }
      >
        {editing && (
          <div className={styles.form}>
            {errorMessage && <Alert tone="danger" title="That didn’t save">{errorMessage}</Alert>}
            <Field id={`${id}-label`} label="Label" optional hint="For example Home or Office.">
              <Input value={editing.label} maxLength={60} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            </Field>
            <AddressForm section="shipping" idPrefix={`${id}-address`} legend="Address" value={editing.address} errors={errors} onChange={(address) => setEditing({ ...editing, address })} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleting ? `Delete ${nameOf(deleting)}?` : ''}
        size="sm"
        footer={
          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep address
            </Button>
            <Button variant="secondary" className={styles.destructive} onClick={remove}>
              <Icon name="trash" size="sm" /> Delete address
            </Button>
          </div>
        }
      >
        {deleting && <p>{deleting.isDefaultShipping || deleting.isDefaultBilling ? 'This is a default address. Your next saved address becomes the default.' : 'You can add it again later.'}</p>}
      </Modal>
    </div>
  );
}
