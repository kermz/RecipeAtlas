import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createIngredient, deleteIngredient, resetIngredients, updateIngredient } from './api';
import { recipeKeys } from '../recipes/hooks';
import type { RecipeIngredientInput } from '../../lib/types';

export function useCreateIngredient(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeIngredientInput) => createIngredient(recipeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useUpdateIngredient(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ingredientId, input }: { ingredientId: string; input: Partial<RecipeIngredientInput> }) =>
      updateIngredient(ingredientId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useDeleteIngredient(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIngredient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useResetIngredients(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetIngredients(recipeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}
