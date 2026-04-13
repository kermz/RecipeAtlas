import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
type RecipeLike = {
  id: string;
  title: string;
  description: string | null | undefined;
  visibility?: 'private' | 'public';
} | null;

const recipeSchema = z.object({
  title: z.string().min(1, 'Recipe title is required'),
  description: z.string().optional(),
  visibility: z.enum(['private', 'public']).default('private')
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

type RecipeDialogProps = {
  open: boolean;
  recipe?: RecipeLike;
  onClose: () => void;
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
  onDelete?: (recipeId: string) => void;
};

export function RecipeDialog({ open, recipe, onClose, onSubmit, onDelete }: RecipeDialogProps) {
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: recipe?.title ?? '',
      description: recipe?.description ?? '',
      visibility: recipe?.visibility ?? 'private'
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      title: recipe?.title ?? '',
      description: recipe?.description ?? '',
      visibility: recipe?.visibility ?? 'private'
    });
  }, [form, open, recipe]);

  return (
    <Dialog
      open={open}
      title={recipe ? 'Edit recipe' : 'Create a recipe'}
      description="Create a recipe with a clear title and optional context, then move into ingredients and steps."
      onClose={onClose}
    >
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
          onClose();
        })}
      >
        <Field label="Recipe title" error={form.formState.errors.title?.message}>
          <Input placeholder="Sunday pasta" {...form.register('title')} />
        </Field>
        <Field label="Description" hint="Optional short context for the recipe." error={form.formState.errors.description?.message}>
          <Textarea placeholder="A light tomato sauce with fresh basil." {...form.register('description')} />
        </Field>
        <Field label="Visibility" hint="Private recipes stay hidden unless you invite editors. Public recipes can be viewed by anyone with access to the app.">
          <div className="flex flex-wrap gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1.5">
            <Button
              type="button"
              variant={form.watch('visibility') === 'private' ? 'primary' : 'ghost'}
              onClick={() => form.setValue('visibility', 'private')}
            >
              Private
            </Button>
            <Button
              type="button"
              variant={form.watch('visibility') === 'public' ? 'primary' : 'ghost'}
              onClick={() => form.setValue('visibility', 'public')}
            >
              Public
            </Button>
          </div>
        </Field>
        <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            {recipe && onDelete ? (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  onDelete(recipe.id);
                  onClose();
                }}
              >
                Delete recipe
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{recipe ? 'Save recipe' : 'Create recipe'}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
