import { useEffect } from 'react';
import Spinner from './Spinner';

interface ConfirmDialogProps {
  /** When false the dialog renders nothing. */
  open: boolean;
  title: string;
  message: string;
  /** Confirm button label. Defaults to "Delete". */
  confirmLabel?: string;
  /** Disables the confirm button and shows it as busy (e.g. while the delete request is in flight). */
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Small modal used to guard destructive actions. Closes on Escape or a
 * backdrop click (both treated as cancel), and the confirm button is styled
 * as a danger action.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-semibold text-themed-primary">{title}</h2>
        <p className="mb-6 text-sm text-themed-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isBusy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger inline-flex items-center gap-2"
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
