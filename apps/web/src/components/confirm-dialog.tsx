import { Button } from './ui/button';
import { Dialog } from './ui/dialog';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} description={description} onClose={onClose}>
      <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="secondary" onClick={onClose} className="sm:min-w-28">
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading} className="sm:min-w-32">
          {loading ? 'Working...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
