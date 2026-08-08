import { useEffect } from 'react';
import Spinner from './Spinner';

interface ConfirmDialogProps {
  /** When false the dialog renders nothing. */
  open: boolean;
  title: string;
  message: string;
  /** Confirm button label. Defaults to "Delete". */
  confirmLabel?: string;
  /**
   * `danger` (default) is the coral treatment for anything destructive;
   * `primary` is the gold one, for confirmations that only start over.
   */
  tone?: 'danger' | 'primary';
  /** Disables the confirm button and shows it as busy (e.g. while the delete request is in flight). */
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small modal used to guard destructive actions. Closes on Escape or a
 * backdrop click (both treated as cancel).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="dialog-title">{title}</h2>
        <p className="dialog-body">{message}</p>
        <div className="mt-1.5 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isBusy}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
