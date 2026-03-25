import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRecipe, deleteRecipe, getRecipe, listRecipes, updateRecipe } from './api';
import type { RecipeInput } from '../../lib/types';

export const recipeKeys = {
  all: ['recipes'] as const,
  list: () => [...recipeKeys.all, 'list'] as const,
  detail: (recipeId: string) => [...recipeKeys.all, 'detail', recipeId] as const
};

export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.list(),
    queryFn: listRecipes
  });
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: recipeId ? recipeKeys.detail(recipeId) : ['recipes', 'missing'],
    queryFn: () => getRecipe(recipeId as string),
    enabled: Boolean(recipeId)
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) => createRecipe(input),
    onSuccess: async (recipe) => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.list() });
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipe.id) });
    }
  });
}

export function useUpdateRecipe(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RecipeInput>) => updateRecipe(recipeId, input),
    onSuccess: async (recipe) => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.list() });
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipe.id) });
    }
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.list() });
    }
  });
}
