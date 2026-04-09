import { useEffect, useMemo, useState } from 'react';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuthActions } from './hooks';

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
  const { signIn, signUp } = useAuthActions();

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(defaultMode);
    setForm(initialForm);
    setError(null);
    setIsSubmitting(false);
  }, [defaultMode, open]);

  const title = useMemo(() => (mode === 'sign-in' ? 'Sign in' : 'Create your account'), [mode]);
  const description = useMemo(
    () =>
      mode === 'sign-in'
        ? 'Sign in to keep private recipes tied to your account and manage public sharing.'
        : 'Create an account to save private recipes, share public ones, and keep timers scoped to each recipe.',
    [mode]
  );

  return (
    <Dialog open={open} title={title} description={description} onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!form.email.trim() || !form.password.trim() || (mode === 'sign-up' && !form.name.trim())) {
            setError('Please fill in all required fields.');
            return;
          }

          if (form.password.trim().length < 8) {
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
        <div className="flex flex-wrap gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1.5">
          <Button type="button" variant={mode === 'sign-in' ? 'primary' : 'ghost'} onClick={() => setMode('sign-in')}>
            Sign in
          </Button>
          <Button type="button" variant={mode === 'sign-up' ? 'primary' : 'ghost'} onClick={() => setMode('sign-up')}>
            Create account
          </Button>
        </div>

        {mode === 'sign-up' ? (
          <Field label="Display name">
            <Input
              value={form.name}
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
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                password: event.target.value
              }));
            }}
            placeholder="********"
          />
        </Field>

        {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[color:var(--text-secondary)]">
            {mode === 'sign-in' ? 'New here? Switch to create account.' : 'Already have an account? Switch to sign in.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
