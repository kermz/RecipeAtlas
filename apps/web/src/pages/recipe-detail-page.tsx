import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pencil, Plus, RefreshCcw, RotateCcw, Settings2 } from 'lucide-react';
import { CelebrationConfetti } from '../components/celebration-confetti';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [deletingIngredient, setDeletingIngredient] = useState<RecipeIngredient | null>(null);
  const [deletingStep, setDeletingStep] = useState<RecipeStep | null>(null);
  const [activeConfettiBurst, setActiveConfettiBurst] = useState(0);

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
  const completedStepCount = sortedSteps.filter((step) => Boolean(step.completedAt)).length;
  const stepProgressPercent = sortedSteps.length > 0 ? Math.round((completedStepCount / sortedSteps.length) * 100) : 0;
  const previousProgressRef = useRef(stepProgressPercent);

  const nextPosition = sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1].position + 1 : 1;
  const resettableStepIds = sortedSteps.filter((step) => step.completedAt || step.timerStartedAt).map((step) => step.id);

  useEffect(() => {
    const previousProgress = previousProgressRef.current;

    if (sortedSteps.length > 0 && previousProgress < 100 && stepProgressPercent === 100) {
      setActiveConfettiBurst(Date.now());
    }

    previousProgressRef.current = stepProgressPercent;
  }, [sortedSteps.length, stepProgressPercent]);

  useEffect(() => {
    if (!activeConfettiBurst) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveConfettiBurst(0);
    }, 5200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeConfettiBurst]);

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
      <CelebrationConfetti active={Boolean(activeConfettiBurst)} burstKey={activeConfettiBurst} />
      <div className="flex flex-col gap-1.5 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-2 sm:gap-3 sm:rounded-[28px] sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" variant="secondary" asChild className="justify-center sm:justify-start">
          <Link to="/recipes">
            <ArrowLeft className="h-4 w-4" />
            Back to recipes
          </Link>
        </Button>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button size="sm" variant="secondary" onClick={() => recipeQuery.refetch()}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
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
          {isEditMode ? (
            <Button size="sm" variant="secondary" onClick={() => setRecipeDialogOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Edit recipe
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={isEditMode ? 'primary' : 'secondary'}
            className={isEditMode ? 'ml-auto' : undefined}
            onClick={() => {
              setIsEditMode((current) => !current);
            }}
          >
            {isEditMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {isEditMode ? 'Done editing' : 'Edit mode'}
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="Recipe details"
        title={recipe?.title ?? 'Loading recipe...'}
        description={recipe?.description ?? 'The recipe description will appear here once loaded.'}
        action={
          <div className="flex flex-wrap items-center gap-2 xl:max-w-md xl:justify-end">
            <Badge tone="neutral">{recipe?.ingredients.length ?? 0} ingredients</Badge>
            <Badge tone="accent">{recipe?.steps.length ?? 0} steps</Badge>
            <Badge tone="neutral">{recipe ? formatRecipeTotalTime(recipe) : 'No timers'}</Badge>
            {recipeQuery.isFetching ? <Badge tone="neutral">Syncing...</Badge> : null}
          </div>
        }
      />

      {recipe ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.5fr)]">
            <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-2.5 pt-3.5 pb-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:rounded-[30px] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/8 pb-3.5 sm:gap-4 sm:pb-5 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="app-heading text-[1.2rem] font-semibold leading-[1.02] text-white sm:text-3xl">Ingredients</h2>
                {isEditMode ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingIngredient(null);
                      setIngredientDialogOpen(true);
                    }}
                    className="sm:self-start"
                  >
                    <Plus className="h-4 w-4" />
                    Add ingredient
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 sm:mt-5">
                <IngredientList
                  editMode={isEditMode}
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
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-2.5 pt-3.5 pb-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:rounded-[30px] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/8 pb-3.5 sm:gap-4 sm:pb-5 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="app-heading text-[1.2rem] font-semibold leading-[1.02] text-white sm:text-3xl">Steps</h2>
                {isEditMode ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingStep(null);
                      setStepDialogOpen(true);
                    }}
                    className="sm:self-start"
                  >
                    <Plus className="h-4 w-4" />
                    Add step
                  </Button>
                ) : null}
              </div>
              <div className="mt-3.5 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.14)] sm:mt-5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] sm:text-[10px]">Progress</p>
                    <p className="mt-1 text-[11px] font-medium text-[color:var(--accent-strong)] sm:text-xs">
                      {completedStepCount} / {sortedSteps.length} done
                    </p>
                  </div>
                  <div className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-[color:var(--text-secondary)] sm:text-[11px]">
                    {stepProgressPercent}%
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(191,209,171,0.95),rgba(127,155,113,0.9))] transition-[width] duration-300 ease-out"
                    style={{ width: `${stepProgressPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 sm:mt-5">
                <StepList
                  editMode={isEditMode}
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
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-sm text-[color:var(--text-secondary)]">Loading recipe...</div>
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
