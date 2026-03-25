import { api } from '../../lib/api';
import type { RecipeStep, RecipeStepInput } from '../../lib/types';

export function createStep(recipeId: string, input: RecipeStepInput) {
  return api.post<RecipeStep>(`/recipes/${recipeId}/steps`, input);
}

export function updateStep(stepId: string, input: Partial<RecipeStepInput>) {
  return api.patch<RecipeStep>(`/steps/${stepId}`, input);
}

export function deleteStep(stepId: string) {
  return api.delete<void>(`/steps/${stepId}`);
}

export function startStepTimer(stepId: string) {
  return api.post<RecipeStep>(`/steps/${stepId}/start-timer`);
}

export function completeStep(stepId: string) {
  return api.post<RecipeStep>(`/steps/${stepId}/complete`);
}

export function resetStep(stepId: string) {
  return api.post<RecipeStep>(`/steps/${stepId}/reset`);
}
