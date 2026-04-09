import { useState } from 'react';
import { MailPlus, UserMinus } from 'lucide-react';
import type { RecipeCollaborator } from '../../lib/types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';

type RecipeSharingPanelProps = {
  collaborators: RecipeCollaborator[];
  isAdding: boolean;
  isRemoving: boolean;
  onAdd: (email: string) => Promise<void>;
  onRemove: (collaboratorId: string) => Promise<void>;
};

export function RecipeSharingPanel({ collaborators, isAdding, isRemoving, onAdd, onRemove }: RecipeSharingPanelProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="app-heading text-[1.15rem] font-semibold leading-[1.02] text-white sm:text-[1.8rem]">Sharing</h2>
          <Badge tone="accent">{collaborators.length} editors</Badge>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
          Invite editors by email so they can update ingredients, reorder steps, run timers, and mark progress together.
        </p>
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          try {
            await onAdd(email);
            setEmail('');
          } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Could not add collaborator');
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <Field
            label="Invite by email"
            hint="Access is tied to the account that signs in with this email."
            error={error ?? undefined}
          >
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cook@example.com"
            />
          </Field>
        </div>
        <Button type="submit" disabled={isAdding || email.trim().length === 0}>
          <MailPlus className="h-4 w-4" />
          Add editor
        </Button>
      </form>

      <div className="mt-5 space-y-3">
        {collaborators.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-[color:var(--text-secondary)]">
            No editors added yet. Private recipes stay collaborative only with the people you invite here.
          </div>
        ) : (
          collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{collaborator.email}</p>
                <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                  {collaborator.isCurrentUser ? 'This is you.' : 'Can edit recipe content and cooking progress.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRemoving}
                onClick={async () => {
                  setError(null);

                  try {
                    await onRemove(collaborator.id);
                  } catch (nextError) {
                    setError(nextError instanceof Error ? nextError.message : 'Could not remove collaborator');
                  }
                }}
              >
                <UserMinus className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
