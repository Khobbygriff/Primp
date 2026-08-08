import { useState, type ReactNode } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** When set, renders a required free-text reason field (e.g. suspension reason) and passes its value to onConfirm. */
  requireReason?: boolean;
  reasonPlaceholder?: string;
  isSubmitting?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  requireReason,
  reasonPlaceholder = 'Reason (visible in the audit log)…',
  isSubmitting,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{body}</div>

        {requireReason && (
          <textarea
            className={styles.textarea}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.buttonSecondary} onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.buttonDanger}
            onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
            disabled={!canConfirm || isSubmitting}
          >
            {isSubmitting ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
