import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import type { IngredientUnit, RecipeIngredient } from '../../lib/types';
import { ingredientUnits } from './units';

const ingredientUnitValues = ingredientUnits.map((unit) => unit.value) as [IngredientUnit, ...IngredientUnit[]];

const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.enum(ingredientUnitValues),
  notes: z.string().optional()
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

type IngredientDialogProps = {
  open: boolean;
  recipeTitle: string;
  ingredient?: RecipeIngredient;
  onClose: () => void;
  onSubmit: (values: IngredientFormValues) => Promise<void> | void;
  onDelete?: (ingredientId: string) => void;
};

export function IngredientDialog({
  open,
  recipeTitle,
  ingredient,
  onClose,
  onSubmit,
  onDelete
}: IngredientDialogProps) {
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: ingredient?.name ?? '',
      quantity: ingredient?.quantity ?? 1,
      unit: ingredient?.unit ?? 'g',
      notes: ingredient?.notes ?? ''
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      name: ingredient?.name ?? '',
      quantity: ingredient?.quantity ?? 1,
      unit: ingredient?.unit ?? 'g',
      notes: ingredient?.notes ?? ''
    });
  }, [form, ingredient, open]);

  return (
    <Dialog
      open={open}
      title={ingredient ? 'Edit ingredient' : 'Add ingredient'}
      description={`Build the ingredient list for ${recipeTitle}, including units that can be converted per ingredient.`}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
          onClose();
        })}
      >
        <Field label="Ingredient name" error={form.formState.errors.name?.message}>
          <Input placeholder="Bread flour" {...form.register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quantity" error={form.formState.errors.quantity?.message}>
            <Input type="number" min={0.01} step="any" {...form.register('quantity')} />
          </Field>
          <Field label="Unit" className="sm:col-span-2" error={form.formState.errors.unit?.message}>
            <select
              className="h-11 w-full rounded-xl border border-white/12 bg-slate-950/50 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/30"
              {...form.register('unit')}
            >
              {ingredientUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes" hint="Optional prep notes, like sifted or room temperature." error={form.formState.errors.notes?.message}>
          <Textarea placeholder="Finely grated, lightly packed, chilled..." {...form.register('notes')} />
        </Field>
        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            {ingredient && onDelete ? (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  onDelete(ingredient.id);
                  onClose();
                }}
              >
                Delete ingredient
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{ingredient ? 'Save ingredient' : 'Add ingredient'}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
