import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCcw, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PageHeader } from '../components/page-header';
import { ConfirmDialog } from '../components/confirm-dialog';
import { IngredientDialog, type IngredientFormValues } from '../features/ingredients/ingredient-dialog';
import { IngredientList } from '../features/ingredients/ingredient-list';
import { useCreateIngredient, useDeleteIngredient, useUpdateIngredient } from '../features/ingredients/hooks';
import { RecipeDialog, type RecipeFormValues } from '../features/recipes/recipe-dialog';
import { formatRecipeTotalTime } from '../features/recipes/total-time';
import { StepDialog, type StepFormValues } from '../features/recipe-steps/step-dialog';
import { StepList } from '../features/recipe-steps/step-list';
import { useDeleteRecipe, useRecipe, useUpdateRecipe } from '../features/recipes/hooks';
import { useCompleteStep, useCreateStep, useDeleteStep, useResetAllSteps, useResetStep, useStartStepTimer, useUpdateStep } from '../features/recipe-steps/hooks';
import type { RecipeIngredient, RecipeStep } from '../lib/types';

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const recipeQuery = useRecipe(recipeId);
  const recipe = recipeQuery.data;

  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [deletingIngredient, setDeletingIngredient] = useState<RecipeIngredient | null>(null);
  const [deletingStep, setDeletingStep] = useState<RecipeStep | null>(null);

  const updateRecipe = useUpdateRecipe(recipeId ?? '');
  const createIngredient = useCreateIngredient(recipeId ?? '');
  const updateIngredient = useUpdateIngredient(recipeId ?? '');
  const deleteIngredient = useDeleteIngredient(recipeId ?? '');
  const deleteRecipe = useDeleteRecipe();
  const createStep = useCreateStep(recipeId ?? '');
  const updateStep = useUpdateStep(recipeId ?? '');
  const deleteStep = useDeleteStep(recipeId ?? '');
  const completeStep = useCompleteStep(recipeId ?? '');
  const startStepTimer = useStartStepTimer(recipeId ?? '');
  const resetStep = useResetStep(recipeId ?? '');
  const resetAllSteps = useResetAllSteps(recipeId ?? '');

  const sortedIngredients = useMemo(
    () => [...(recipe?.ingredients ?? [])].sort((left, right) => left.position - right.position),
    [recipe?.ingredients]
  );
  const sortedSteps = useMemo(
    () => [...(recipe?.steps ?? [])].sort((left, right) => left.position - right.position),
    [recipe?.steps]
  );

  const nextPosition = sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1].position + 1 : 1;
  const resettableStepIds = sortedSteps.filter((step) => step.completedAt || step.timerStartedAt).map((step) => step.id);

  if (!recipeId) {
    return null;
  }

  if (recipeQuery.isError) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" asChild>
          <Link to="/recipes">
            <ArrowLeft className="h-4 w-4" />
            Back to recipes
          </Link>
        </Button>
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          Could not load this recipe. It may have been removed or the API is unreachable.
        </div>
      </div>
    );
  }

  const submitRecipe = async (values: RecipeFormValues) => {
    await updateRecipe.mutateAsync({
      title: values.title,
      description: values.description?.trim() ? values.description.trim() : null
    });
  };

  const submitIngredient = async (values: IngredientFormValues) => {
    const payload = {
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      notes: values.notes?.trim() ? values.notes.trim() : null,
      position: editingIngredient?.position ?? sortedIngredients.length + 1
    };

    if (editingIngredient) {
      await updateIngredient.mutateAsync({
        ingredientId: editingIngredient.id,
        input: payload
      });
      return;
    }

    await createIngredient.mutateAsync(payload);
  };

  const submitStep = async (values: StepFormValues) => {
    const payload = {
      title: values.title,
      instructions: values.instructions?.trim() ? values.instructions.trim() : null,
      position: values.position,
      timerDurationSeconds: values.timerDurationSeconds?.trim() ? Number(values.timerDurationSeconds) : null
    };

    if (editingStep) {
      await updateStep.mutateAsync({
        stepId: editingStep.id,
        input: payload
      });
      return;
    }

    await createStep.mutateAsync(payload);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" asChild>
          <Link to="/recipes">
            <ArrowLeft className="h-4 w-4" />
            Back to recipes
          </Link>
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => recipeQuery.refetch()}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            disabled={resettableStepIds.length === 0 || resetAllSteps.isPending}
            onClick={async () => {
              if (resettableStepIds.length === 0) {
                return;
              }

              await resetAllSteps.mutateAsync(resettableStepIds);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset all steps
          </Button>
          <Button variant="secondary" onClick={() => setRecipeDialogOpen(true)}>
            <Settings2 className="h-4 w-4" />
            Edit recipe
          </Button>
          <Button onClick={() => setStepDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add step
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="Recipe details"
        title={recipe?.title ?? 'Loading recipe...'}
        description={recipe?.description ?? 'The recipe description will appear here once loaded.'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{recipe?.ingredients.length ?? 0} ingredients</Badge>
            <Badge tone="accent">{recipe?.steps.length ?? 0} steps</Badge>
            <Badge tone="neutral">{recipe ? formatRecipeTotalTime(recipe) : 'No timers'}</Badge>
            <Badge tone="neutral">{recipeQuery.isFetching ? 'Syncing...' : 'Live data'}</Badge>
          </div>
        }
      />

      {recipe ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="app-heading text-3xl font-semibold text-white">Ingredients</h2>
                <p className="mt-2 text-sm text-slate-300">Track ingredient amounts with unit-aware conversions for each row.</p>
              </div>
              <Button
                onClick={() => {
                  setEditingIngredient(null);
                  setIngredientDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add ingredient
              </Button>
            </div>
            <IngredientList
              ingredients={sortedIngredients}
              onAdd={() => {
                setEditingIngredient(null);
                setIngredientDialogOpen(true);
              }}
              onEdit={(ingredient) => {
                setEditingIngredient(ingredient);
                setIngredientDialogOpen(true);
              }}
              onReorder={async (ingredient, position) => {
                await updateIngredient.mutateAsync({
                  ingredientId: ingredient.id,
                  input: { position }
                });
              }}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="app-heading text-3xl font-semibold text-white">Steps</h2>
                <p className="mt-2 text-sm text-slate-300">Keep the method in order, track timers, and mark steps as they finish.</p>
              </div>
              <Button
                onClick={() => {
                  setEditingStep(null);
                  setStepDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add step
              </Button>
            </div>
            <StepList
              steps={sortedSteps}
              onAdd={() => {
                setEditingStep(null);
                setStepDialogOpen(true);
              }}
              onEdit={(step) => {
                setEditingStep(step);
                setStepDialogOpen(true);
              }}
              onComplete={async (step) => {
                await completeStep.mutateAsync(step.id);
              }}
              onStartTimer={async (step) => {
                await startStepTimer.mutateAsync(step.id);
              }}
              onReset={async (step) => {
                await resetStep.mutateAsync(step.id);
              }}
              onReorder={async (step, position) => {
                await updateStep.mutateAsync({
                  stepId: step.id,
                  input: { position }
                });
              }}
            />
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">Loading recipe...</div>
      )}

      <RecipeDialog
        open={recipeDialogOpen}
        recipe={recipe ?? null}
        onClose={() => setRecipeDialogOpen(false)}
        onSubmit={submitRecipe}
        onDelete={() => {
          setDeletingRecipe(true);
        }}
      />

      <IngredientDialog
        open={ingredientDialogOpen}
        recipeTitle={recipe?.title ?? 'recipe'}
        ingredient={editingIngredient ?? undefined}
        onClose={() => {
          setIngredientDialogOpen(false);
          setEditingIngredient(null);
        }}
        onSubmit={submitIngredient}
        onDelete={(ingredientId) => {
          const ingredient = sortedIngredients.find((item) => item.id === ingredientId) ?? null;
          setDeletingIngredient(ingredient);
        }}
      />

      <StepDialog
        open={stepDialogOpen}
        recipeTitle={recipe?.title ?? 'recipe'}
        step={editingStep ?? undefined}
        suggestedPosition={editingStep?.position ?? nextPosition}
        onClose={() => {
          setStepDialogOpen(false);
          setEditingStep(null);
        }}
        onSubmit={submitStep}
        onDelete={(stepId) => {
          const step = sortedSteps.find((item) => item.id === stepId) ?? null;
          setDeletingStep(step);
        }}
      />

      <ConfirmDialog
        open={deletingRecipe}
        title="Delete recipe?"
        description={`This will remove "${recipe?.title}" with all of its ingredients and steps.`}
        confirmLabel="Delete recipe"
        danger
        loading={deleteRecipe.isPending}
        onClose={() => setDeletingRecipe(false)}
        onConfirm={async () => {
          if (!recipeId) {
            return;
          }

          await deleteRecipe.mutateAsync(recipeId);
          setDeletingRecipe(false);
          navigate('/recipes');
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingIngredient)}
        title="Delete ingredient?"
        description={`This will remove ingredient ${deletingIngredient?.position} from the recipe.`}
        confirmLabel="Delete ingredient"
        danger
        loading={deleteIngredient.isPending}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={async () => {
          if (!deletingIngredient) {
            return;
          }

          await deleteIngredient.mutateAsync(deletingIngredient.id);
          setDeletingIngredient(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingStep)}
        title="Delete step?"
        description={`This will remove step ${deletingStep?.position} from the recipe.`}
        confirmLabel="Delete step"
        danger
        loading={deleteStep.isPending}
        onClose={() => setDeletingStep(null)}
        onConfirm={async () => {
          if (!deletingStep) {
            return;
          }

          await deleteStep.mutateAsync(deletingStep.id);
          setDeletingStep(null);
        }}
      />
    </section>
  );
}
