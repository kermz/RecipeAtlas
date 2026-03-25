import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import type { RecipeStep } from '../../lib/types';

const stepSchema = z.object({
  title: z.string().min(1, 'A step title is required'),
  instructions: z.string().optional(),
  position: z.coerce.number().int().min(1, 'Position must be at least 1'),
  timerDurationSeconds: z
    .string()
    .optional()
    .refine((value) => !value || Number.isInteger(Number(value)) && Number(value) >= 1, 'Timer must be at least 1 second')
});

export type StepFormValues = z.infer<typeof stepSchema>;

type StepDialogProps = {
  open: boolean;
  recipeTitle: string;
  step?: RecipeStep;
  suggestedPosition: number;
  onClose: () => void;
  onSubmit: (values: StepFormValues) => Promise<void> | void;
  onDelete?: (stepId: string) => void;
};

export function StepDialog({ open, recipeTitle, step, suggestedPosition, onClose, onSubmit, onDelete }: StepDialogProps) {
  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      title: step?.title ?? '',
      instructions: step?.instructions ?? '',
      position: step?.position ?? suggestedPosition,
      timerDurationSeconds: step?.timerDurationSeconds?.toString() ?? ''
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      title: step?.title ?? '',
      instructions: step?.instructions ?? '',
      position: step?.position ?? suggestedPosition,
      timerDurationSeconds: step?.timerDurationSeconds?.toString() ?? ''
    });
  }, [form, open, step, suggestedPosition]);

  return (
    <Dialog
      open={open}
      title={step ? 'Edit step' : 'Create a new step'}
      description={`Track an ordered step for ${recipeTitle}. Timers stay local until you mark the step done.`}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
          onClose();
        })}
      >
        <Field label="Step title" error={form.formState.errors.title?.message}>
          <Input placeholder="Mix the dough" {...form.register('title')} />
        </Field>
        <Field label="Instructions" hint="Optional details for the step." error={form.formState.errors.instructions?.message}>
          <Textarea placeholder="Work until just combined." {...form.register('instructions')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Position" hint="Lower numbers appear first." error={form.formState.errors.position?.message}>
            <Input type="number" min={1} {...form.register('position')} />
          </Field>
          <Field
            label="Timer length"
            hint="Leave blank if this step does not use a countdown."
            error={form.formState.errors.timerDurationSeconds?.message}
          >
            <Input type="number" min={1} placeholder="300" {...form.register('timerDurationSeconds')} />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            {step && onDelete ? (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  onDelete(step.id);
                  onClose();
                }}
              >
                Delete step
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">{step ? 'Save step' : 'Add step'}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
