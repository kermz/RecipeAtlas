import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import type { Passkey } from '@better-auth/passkey';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuthActions } from './auth-actions';
import { useAuthSession } from './auth-session';
import { isPasskeySupported, syncAcceptedPasskeysOnDevice } from './passkey-browser';
import { usePasskeys } from './passkey-queries';

type PasskeySettingsPanelProps = {
  active: boolean;
};

const createdAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatCreatedAt(createdAt: Passkey['createdAt']) {
  if (!createdAt) {
    return 'just now';
  }

  const value = createdAt instanceof Date ? createdAt : new Date(createdAt);

  return Number.isNaN(value.getTime()) ? 'recently' : createdAtFormatter.format(value);
}

function getPasskeyLabel(passkey: Passkey, index: number) {
  const name = passkey.name?.trim();
  return name && name.length > 0 ? name : `Passkey ${index + 1}`;
}

export function PasskeySettingsPanel({ active }: PasskeySettingsPanelProps) {
  const [passkeyName, setPasskeyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthSession();
  const { addPasskey, deletePasskey } = useAuthActions();
  const passkeySupport = isPasskeySupported();
  const passkeysQuery = usePasskeys(active && isAuthenticated);

  useEffect(() => {
    if (!active) {
      return;
    }

    setPasskeyName('');
    setError(null);
    setPendingAction(null);
  }, [active]);

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-[color:var(--text-secondary)]">
        <p className="font-medium text-white">{user?.email ?? 'Signed-in account'}</p>
        <p className="mt-2 leading-6">
          Passkeys stay tied to your account, so recipe ownership and collaborator access continue to work exactly the same way after sign-in.
        </p>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="New passkey name" hint="Optional. Give this device a friendly label.">
              <Input
                value={passkeyName}
                onChange={(event) => setPasskeyName(event.target.value)}
                placeholder="Kitchen laptop"
                disabled={!passkeySupport || pendingAction === 'add'}
              />
            </Field>
          </div>
          <Button
            onClick={async () => {
              if (!passkeySupport) {
                setError('This browser or context does not support passkeys.');
                return;
              }

              setError(null);
              setPendingAction('add');

              try {
                await addPasskey({
                  name: passkeyName
                });
                setPasskeyName('');
                passkeysQuery.refetch();
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Could not add the passkey');
              } finally {
                setPendingAction(null);
              }
            }}
            disabled={!passkeySupport || pendingAction === 'add'}
          >
            <KeyRound className="h-4 w-4" />
            {pendingAction === 'add' ? 'Adding passkey' : 'Add passkey'}
          </Button>
        </div>
        {!passkeySupport ? (
          <p className="mt-3 text-sm text-amber-100">
            Passkeys need a supported browser and a secure context such as HTTPS or localhost.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">Registered passkeys</h3>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Remove a device here if you no longer want it to sign in to your account.
            </p>
          </div>
          <Badge tone="accent">{passkeysQuery.data.length} saved</Badge>
        </div>

        {passkeysQuery.isLoading ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-[color:var(--text-secondary)]">
            Loading passkeys...
          </div>
        ) : null}

        {!passkeysQuery.isLoading && passkeysQuery.data.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-6 text-[color:var(--text-secondary)]">
            No passkeys saved yet. Add one from this device to unlock passkey sign-in.
          </div>
        ) : null}

        {!passkeysQuery.isLoading
          ? passkeysQuery.data.map((passkey, index) => (
              <div
                key={passkey.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-white">{getPasskeyLabel(passkey, index)}</p>
                    <Badge tone="neutral">{passkey.deviceType}</Badge>
                    {passkey.backedUp ? <Badge tone="success">Backed up</Badge> : <Badge tone="warning">Single device</Badge>}
                  </div>
                  <div className="space-y-1 text-sm text-[color:var(--text-secondary)]">
                    <p>Added {formatCreatedAt(passkey.createdAt)}</p>
                    {passkey.transports ? <p>Transports: {passkey.transports}</p> : null}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="justify-start text-rose-100 hover:bg-rose-400/10 hover:text-rose-50 sm:justify-center"
                  disabled={pendingAction === passkey.id}
                  onClick={async () => {
                    setError(null);
                    setPendingAction(passkey.id);

                    try {
                      const remainingCredentialIds = passkeysQuery.data
                        .filter((currentPasskey) => currentPasskey.id !== passkey.id)
                        .map((currentPasskey) => currentPasskey.credentialID);

                      await deletePasskey({ passkeyId: passkey.id });

                      if (user?.id) {
                        await syncAcceptedPasskeysOnDevice({
                          userId: user.id,
                          acceptedCredentialIds: remainingCredentialIds
                        });
                      }

                      passkeysQuery.refetch();
                    } catch (nextError) {
                      setError(nextError instanceof Error ? nextError.message : 'Could not remove the passkey');
                    } finally {
                      setPendingAction(null);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {pendingAction === passkey.id ? 'Removing' : 'Remove'}
                </Button>
              </div>
            ))
          : null}
      </div>

      {passkeysQuery.error && !error ? (
        <p className="text-sm font-medium text-rose-200">{passkeysQuery.error.message}</p>
      ) : null}

      {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}

      <div className="flex items-center gap-2 border-t border-white/8 pt-4 text-xs leading-5 text-[color:var(--text-secondary)]">
        <ShieldCheck className="h-4 w-4 text-[color:var(--accent-strong)]" />
        Passkeys still require this signed-in account for enrollment changes.
      </div>
    </div>
  );
}
