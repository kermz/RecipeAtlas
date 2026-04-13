import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { PasskeySettingsPanel } from './passkey-settings-panel';

type PasskeyDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function PasskeyDialog({ open, onClose }: PasskeyDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Manage passkeys"
      description="Use device-backed passkeys for fast, phishing-resistant sign-in while keeping email and password as a fallback."
    >
      <div className="space-y-5">
        <PasskeySettingsPanel active={open} />
        <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div />
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
