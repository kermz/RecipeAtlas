import { api } from '../../lib/api';
import type { RecipeDetail, RecipeInput, RecipeSummary } from '../../lib/types';

export function listRecipes() {
  return api.get<RecipeSummary[]>('/recipes');
}

export function getRecipe(recipeId: string) {
  return api.get<RecipeDetail>(`/recipes/${recipeId}`);
}

export function createRecipe(input: RecipeInput) {
  return api.post<RecipeDetail>('/recipes', input);
}

export function updateRecipe(recipeId: string, input: Partial<RecipeInput>) {
  return api.patch<RecipeDetail>(`/recipes/${recipeId}`, input);
}

export function deleteRecipe(recipeId: string) {
  return api.delete<void>(`/recipes/${recipeId}`);
}
