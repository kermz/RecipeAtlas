import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { RecipeInput } from '../../lib/types';
import { useConvexMutation } from '../../lib/use-convex-mutation';

export function useRecipes() {
  const data = useQuery(api.recipes.listRecipes);

  return {
    data,
    isLoading: data === undefined,
    isError: false
  };
}

export function useRecipe(recipeId: string | undefined) {
  const data = useQuery(api.recipes.getRecipe, recipeId ? { recipeId: recipeId as never } : 'skip');

  return {
    data: data ?? undefined,
    isLoading: data === undefined,
    isError: data === null,
    isFetching: false
  };
}

export function useCreateRecipe() {
  return useConvexMutation(api.recipes.createRecipe) as {
    isPending: boolean;
    mutateAsync: (input: RecipeInput) => Promise<any>;
  };
}

export function useUpdateRecipe(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.updateRecipe);

  return {
    ...mutation,
    mutateAsync: (input: Partial<RecipeInput>) => mutation.mutateAsync({ recipeId, ...input })
  };
}

export function useDeleteRecipe() {
  const mutation = useConvexMutation(api.recipes.deleteRecipe);

  return {
    ...mutation,
    mutateAsync: (recipeId: string) => mutation.mutateAsync({ recipeId })
  };
}

export function useAddRecipeCollaborator(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.addRecipeCollaborator);

  return {
    ...mutation,
    mutateAsync: (email: string) => mutation.mutateAsync({ recipeId, email })
  };
}

export function useRemoveRecipeCollaborator(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.removeRecipeCollaborator);

  return {
    ...mutation,
    mutateAsync: (collaboratorId: string) => mutation.mutateAsync({ recipeId, collaboratorId })
  };
}
