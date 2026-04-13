import { useEffect, useMemo, useState } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { useAuthActions, useAuthSession } from './hooks';
import { PasskeySettingsPanel } from './passkey-settings-panel';

type UserSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

type UserSettingsTab = 'account' | 'passkeys';

export function UserSettingsDialog({ open, onClose }: UserSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<UserSettingsTab>('account');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const { signOut } = useAuthActions();
  const username = useMemo(() => user?.name?.trim() || 'No display name yet', [user?.name]);

  useEffect(() => {
    if (open) {
      setActiveTab('account');
      setIsSigningOut(false);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="User settings"
      description="Your recipes, collaborators, and passkeys all stay attached to this account."
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <div role="tablist" aria-label="User settings sections" className="flex flex-wrap gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-1.5">
          <Button
            role="tab"
            aria-selected={activeTab === 'account'}
            aria-controls="user-settings-account-panel"
            id="user-settings-account-tab"
            variant={activeTab === 'account' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('account')}
          >
            <UserRound className="h-4 w-4" />
            User settings
          </Button>
          <Button
            role="tab"
            aria-selected={activeTab === 'passkeys'}
            aria-controls="user-settings-passkeys-panel"
            id="user-settings-passkeys-tab"
            variant={activeTab === 'passkeys' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('passkeys')}
          >
            <KeyRound className="h-4 w-4" />
            Passkeys
          </Button>
        </div>

        {activeTab === 'account' ? (
          <section
            role="tabpanel"
            id="user-settings-account-panel"
            aria-labelledby="user-settings-account-tab"
            className="space-y-5"
          >
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="app-kicker">Profile</p>
              <div className="mt-4 space-y-4 text-sm text-[color:var(--text-secondary)]">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Display name</p>
                  <p className="mt-2 text-base text-white">{username}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Email</p>
                  <p className="mt-2 text-base text-white">{user?.email ?? 'No email available'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/8 pt-4">
              <Button
                variant="danger"
                disabled={isSigningOut}
                onClick={async () => {
                  setError(null);
                  setIsSigningOut(true);

                  try {
                    await signOut();
                    onClose();
                    navigate('/', { replace: true });
                  } catch (nextError) {
                    setError(nextError instanceof Error ? nextError.message : 'Could not sign out');
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out' : 'Sign out'}
              </Button>
            </div>
            {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}
          </section>
        ) : (
          <section
            role="tabpanel"
            id="user-settings-passkeys-panel"
            aria-labelledby="user-settings-passkeys-tab"
          >
            <PasskeySettingsPanel active={open && activeTab === 'passkeys'} />
          </section>
        )}
      </div>
    </Dialog>
  );
}
