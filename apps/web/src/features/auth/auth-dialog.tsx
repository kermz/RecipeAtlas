import { useEffect, useMemo, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { isPasskeySupported, useAuthActions } from './hooks';

type AuthMode = 'sign-in' | 'sign-up';

type AuthDialogProps = {
  open: boolean;
  defaultMode?: AuthMode;
  onClose: () => void;
};

const initialForm = {
  name: '',
  email: '',
  password: ''
};

export function AuthDialog({ open, defaultMode = 'sign-in', onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signInWithPasskey, signUp } = useAuthActions();
  const passkeySupport = useMemo(() => isPasskeySupported(), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(defaultMode);
    setForm(initialForm);
    setError(null);
    setIsSubmitting(false);
  }, [defaultMode, open]);

  const title = useMemo(() => (mode === 'sign-in' ? 'Welcome back' : 'Create your account'), [mode]);
  const description = useMemo(
    () =>
      mode === 'sign-in'
        ? 'Sign in with a passkey or your email and password.'
        : 'Create one account for your recipes, sharing, and collaborators.',
    [mode]
  );

  return (
    <Dialog open={open} title={title} description={description} onClose={onClose} className="max-w-xl">
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!form.email.trim() || !form.password.trim() || (mode === 'sign-up' && !form.name.trim())) {
            setError('Please fill in all required fields.');
            return;
          }

          if (mode === 'sign-up' && form.password.trim().length < 8) {
            setError('Passwords must be at least 8 characters.');
            return;
          }

          setIsSubmitting(true);

          try {
            if (mode === 'sign-in') {
              await signIn({
                email: form.email.trim(),
                password: form.password
              });
            } else {
              await signUp({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
              });
            }

            onClose();
          } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Authentication failed');
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="flex gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] p-1.5">
          <Button type="button" variant={mode === 'sign-in' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('sign-in')}>
            Sign in
          </Button>
          <Button type="button" variant={mode === 'sign-up' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setMode('sign-up')}>
            Create account
          </Button>
        </div>

        {mode === 'sign-in' ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">Use a passkey on this device</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  Fastest if you have already saved one here.
                </p>
              </div>
              <KeyRound className="mt-1 h-5 w-5 shrink-0 text-[color:var(--accent-strong)]" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              disabled={!passkeySupport || isSubmitting}
              onClick={async () => {
                if (!passkeySupport) {
                  setError('This browser or context does not support passkeys.');
                  return;
                }

                setError(null);
                setIsSubmitting(true);

                try {
                  await signInWithPasskey();
                  onClose();
                } catch (nextError) {
                  setError(nextError instanceof Error ? nextError.message : 'Authentication failed');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <KeyRound className="h-4 w-4" />
              Sign in with passkey
            </Button>

            {!passkeySupport ? (
              <p className="mt-3 text-sm text-amber-100">
                Passkeys require a supported browser and a secure context such as HTTPS or localhost.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 sm:p-5">
          {mode === 'sign-in' ? (
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">Or continue with email</p>
          ) : (
            <p className="mb-4 text-sm leading-6 text-[color:var(--text-secondary)]">
              Start with your name, email, and password. You can add a passkey later from user settings.
            </p>
          )}

          <div className="space-y-4">
            {mode === 'sign-up' ? (
              <Field label="Display name" hint="Shown on recipes you own or share.">
                <Input
                  value={form.name}
                  autoComplete="name"
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      name: event.target.value
                    }));
                  }}
                  placeholder="Kitchen Atlas"
                />
              </Field>
            ) : null}

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                autoComplete={mode === 'sign-in' ? 'username' : 'email'}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    email: event.target.value
                  }));
                }}
                placeholder="chef@example.com"
              />
            </Field>

            <Field label="Password" hint={mode === 'sign-up' ? 'Use at least 8 characters.' : undefined}>
              <Input
                type="password"
                value={form.password}
                autoComplete={mode === 'sign-in' ? 'current-password webauthn' : 'new-password'}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    password: event.target.value
                  }));
                }}
                placeholder="********"
              />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}
      </form>
    </Dialog>
  );
}
