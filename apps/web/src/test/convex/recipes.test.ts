import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createConvexTestAuth, createConvexTestDb } from './test-helpers';
import {
  addRecipeCollaborator,
  completeStep,
  createIngredient,
  createRecipe,
  createStep,
  deleteIngredient,
  deleteRecipe,
  deleteStep,
  getRecipe,
  listRecipes,
  removeRecipeCollaborator,
  resetAllSteps,
  resetIngredients,
  resetStep,
  startStepTimer,
  updateIngredient,
  updateRecipe,
  updateStep
} from '../../../convex/recipes';

function getHandler<T extends { _handler: (...args: any[]) => any }>(handler: T) {
  return handler._handler.bind(handler);
}

describe('recipe convex functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
  });

  it('creates, updates, lists, and deletes recipes', async () => {
    const db = createConvexTestDb();
    const auth = createConvexTestAuth();
    const createRecipeHandler = getHandler(createRecipe as any);
    const updateRecipeHandler = getHandler(updateRecipe as any);
    const listRecipesHandler = getHandler(listRecipes as any);
    const deleteRecipeHandler = getHandler(deleteRecipe as any);

    const firstRecipe = await createRecipeHandler({ db, auth }, { title: 'Pasta Night', description: 'Fresh basil', visibility: 'private' });
    vi.setSystemTime(new Date('2026-04-09T12:05:00.000Z'));
    const secondRecipe = await createRecipeHandler({ db, auth }, { title: 'Soup Day', description: null, visibility: 'public' });

    vi.setSystemTime(new Date('2026-04-09T12:10:00.000Z'));
    await updateRecipeHandler({ db, auth }, { recipeId: firstRecipe.id, title: 'Pasta Night Deluxe', visibility: 'public' });

    const recipes = await listRecipesHandler({ db, auth }, {});

    expect(recipes.map((recipe: any) => recipe.title)).toEqual(['Pasta Night Deluxe', 'Soup Day']);
    expect(recipes.find((recipe: any) => recipe.id === firstRecipe.id)?.visibility).toBe('public');
    expect(recipes.find((recipe: any) => recipe.id === firstRecipe.id)?.isOwner).toBe(true);

    const anonymousRecipes = await listRecipesHandler({ db, auth: createConvexTestAuth(null) }, {});
    expect(anonymousRecipes.map((recipe: any) => recipe.title)).toEqual(['Pasta Night Deluxe', 'Soup Day']);

    await deleteRecipeHandler({ db, auth }, { recipeId: secondRecipe.id });

    const afterDelete = await listRecipesHandler({ db, auth }, {});
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].title).toBe('Pasta Night Deluxe');
  });

  it('keeps ingredient ordering contiguous and can reset purchased flags', async () => {
    const db = createConvexTestDb();
    const auth = createConvexTestAuth();
    const createRecipeHandler = getHandler(createRecipe as any);
    const createIngredientHandler = getHandler(createIngredient as any);
    const updateIngredientHandler = getHandler(updateIngredient as any);
    const deleteIngredientHandler = getHandler(deleteIngredient as any);
    const resetIngredientsHandler = getHandler(resetIngredients as any);
    const getRecipeHandler = getHandler(getRecipe as any);
    const recipe = await createRecipeHandler({ db, auth }, { title: 'Bread', description: null });

    const flour = await createIngredientHandler({ db, auth }, { recipeId: recipe.id, name: 'Flour', quantity: 500, unit: 'g', position: 1 });
    await createIngredientHandler({ db, auth }, { recipeId: recipe.id, name: 'Water', quantity: 320, unit: 'ml', position: 2 });
    const salt = await createIngredientHandler({ db, auth }, { recipeId: recipe.id, name: 'Salt', quantity: 10, unit: 'g', position: 2 });

    let detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.ingredients.map((ingredient: any) => `${ingredient.name}:${ingredient.position}`)).toEqual([
      'Flour:1',
      'Salt:2',
      'Water:3'
    ]);

    await updateIngredientHandler({ db, auth }, { ingredientId: salt.id, position: 1, purchased: true });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.ingredients.map((ingredient: any) => `${ingredient.name}:${ingredient.position}`)).toEqual([
      'Salt:1',
      'Flour:2',
      'Water:3'
    ]);
    expect(detail.ingredients.find((ingredient: any) => ingredient.id === salt.id)?.purchased).toBe(true);

    await resetIngredientsHandler({ db, auth }, { recipeId: recipe.id });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.ingredients.every((ingredient: any) => ingredient.purchased === false)).toBe(true);

    await deleteIngredientHandler({ db, auth }, { ingredientId: flour.id });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.ingredients.map((ingredient: any) => ingredient.position)).toEqual([1, 2]);
  });

  it('supports step lifecycle mutations and reset-all in a single mutation', async () => {
    const db = createConvexTestDb();
    const auth = createConvexTestAuth();
    const createRecipeHandler = getHandler(createRecipe as any);
    const createStepHandler = getHandler(createStep as any);
    const updateStepHandler = getHandler(updateStep as any);
    const deleteStepHandler = getHandler(deleteStep as any);
    const startStepTimerHandler = getHandler(startStepTimer as any);
    const completeStepHandler = getHandler(completeStep as any);
    const resetStepHandler = getHandler(resetStep as any);
    const resetAllStepsHandler = getHandler(resetAllSteps as any);
    const getRecipeHandler = getHandler(getRecipe as any);
    const recipe = await createRecipeHandler({ db, auth }, { title: 'Cake', description: null });

    const mix = await createStepHandler({ db, auth }, { recipeId: recipe.id, title: 'Mix', position: 1, timerDurationSeconds: 120 });
    const bake = await createStepHandler({ db, auth }, { recipeId: recipe.id, title: 'Bake', position: 2, timerDurationSeconds: 1800 });
    await createStepHandler({ db, auth }, { recipeId: recipe.id, title: 'Rest', position: 2, timerDurationSeconds: null });

    let detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.steps.map((step: any) => `${step.title}:${step.position}`)).toEqual(['Mix:1', 'Rest:2', 'Bake:3']);

    await updateStepHandler({ db, auth }, { stepId: bake.id, position: 1 });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.steps.map((step: any) => `${step.title}:${step.position}`)).toEqual(['Bake:1', 'Mix:2', 'Rest:3']);

    const started = await startStepTimerHandler({ db, auth }, { stepId: mix.id });
    expect(started.timerStartedAt).toMatch(/^2026-04-09T12:00:00/);

    const completed = await completeStepHandler({ db, auth }, { stepId: mix.id });
    expect(completed.completedAt).toMatch(/^2026-04-09T12:00:00/);

    const reset = await resetStepHandler({ db, auth }, { stepId: mix.id });
    expect(reset.timerStartedAt).toBeNull();
    expect(reset.completedAt).toBeNull();

    await startStepTimerHandler({ db, auth }, { stepId: mix.id });
    await completeStepHandler({ db, auth }, { stepId: bake.id });
    await resetAllStepsHandler({ db, auth }, { recipeId: recipe.id });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.steps.every((step: any) => step.completedAt === null && step.timerStartedAt === null)).toBe(true);

    await deleteStepHandler({ db, auth }, { stepId: mix.id });
    detail = await getRecipeHandler({ db, auth }, { recipeId: recipe.id });
    expect(detail.steps.map((step: any) => step.position)).toEqual([1, 2]);
  });

  it('hides private recipes from other users while keeping public ones visible', async () => {
    const db = createConvexTestDb();
    const ownerAuth = createConvexTestAuth('token-1', 'chef@example.com');
    const collaboratorAuth = createConvexTestAuth('token-2', 'friend@example.com');
    const viewerAuth = createConvexTestAuth('token-3', 'viewer@example.com');
    const createRecipeHandler = getHandler(createRecipe as any);
    const addRecipeCollaboratorHandler = getHandler(addRecipeCollaborator as any);
    const createIngredientHandler = getHandler(createIngredient as any);
    const createStepHandler = getHandler(createStep as any);
    const completeStepHandler = getHandler(completeStep as any);
    const listRecipesHandler = getHandler(listRecipes as any);
    const removeRecipeCollaboratorHandler = getHandler(removeRecipeCollaborator as any);
    const getRecipeHandler = getHandler(getRecipe as any);
    const deleteRecipeHandler = getHandler(deleteRecipe as any);

    const privateRecipe = await createRecipeHandler({ db, auth: ownerAuth }, { title: 'Private Bread', description: null, visibility: 'private' });
    const publicRecipe = await createRecipeHandler({ db, auth: ownerAuth }, { title: 'Public Soup', description: null, visibility: 'public' });
    const collaborator = await addRecipeCollaboratorHandler(
      { db, auth: ownerAuth },
      { recipeId: privateRecipe.id, email: 'friend@example.com' }
    );

    expect(await getRecipeHandler({ db, auth: viewerAuth }, { recipeId: privateRecipe.id })).toBeNull();
    expect(await getRecipeHandler({ db, auth: viewerAuth }, { recipeId: publicRecipe.id })).toMatchObject({
      id: publicRecipe.id,
      isOwner: false,
      isCollaborator: false,
      canEdit: false,
      visibility: 'public'
    });

    expect(await getRecipeHandler({ db, auth: collaboratorAuth }, { recipeId: privateRecipe.id })).toMatchObject({
      id: privateRecipe.id,
      isOwner: false,
      isCollaborator: true,
      canEdit: true,
      collaboratorCount: 1
    });

    await createIngredientHandler(
      { db, auth: collaboratorAuth },
      { recipeId: privateRecipe.id, name: 'Salt', quantity: 10, unit: 'g', position: 1 }
    );
    const step = await createStepHandler(
      { db, auth: collaboratorAuth },
      { recipeId: privateRecipe.id, title: 'Mix', position: 1, timerDurationSeconds: null }
    );
    const completed = await completeStepHandler({ db, auth: collaboratorAuth }, { stepId: step.id });

    expect(completed.completedAt).toMatch(/^2026-04-09T12:00:00/);

    const collaboratorRecipes = await listRecipesHandler({ db, auth: collaboratorAuth }, {});
    expect(collaboratorRecipes.map((recipe: any) => recipe.id)).toContain(privateRecipe.id);

    await expect(deleteRecipeHandler({ db, auth: collaboratorAuth }, { recipeId: privateRecipe.id })).rejects.toThrow(
      'You do not have access to this recipe'
    );

    await removeRecipeCollaboratorHandler(
      { db, auth: ownerAuth },
      { recipeId: privateRecipe.id, collaboratorId: collaborator.id }
    );
    expect(await getRecipeHandler({ db, auth: collaboratorAuth }, { recipeId: privateRecipe.id })).toBeNull();
  });
});
