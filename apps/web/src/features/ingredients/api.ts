import { api } from '../../lib/api';
import type { RecipeIngredient, RecipeIngredientInput } from '../../lib/types';

export function createIngredient(recipeId: string, input: RecipeIngredientInput) {
  return api.post<RecipeIngredient>(`/recipes/${recipeId}/ingredients`, input);
}

export function updateIngredient(ingredientId: string, input: Partial<RecipeIngredientInput>) {
  return api.patch<RecipeIngredient>(`/ingredients/${ingredientId}`, input);
}

export function deleteIngredient(ingredientId: string) {
  return api.delete<void>(`/ingredients/${ingredientId}`);
}
