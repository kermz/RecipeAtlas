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
      description={`Build the ingredient list for ${recipeTitle}, with clean quantities, units, and optional notes.`}
      onClose={onClose}
    >
      <form
        className="space-y-5"
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
            <select className="ui-select w-full" {...form.register('unit')}>
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
        <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
