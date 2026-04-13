import { api } from '../../../convex/_generated/api';
import type { RecipeIngredientInput } from '../../lib/types';
import { useConvexMutation } from '../../lib/use-convex-mutation';

export function useCreateIngredient(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.createIngredient);

  return {
    ...mutation,
    mutateAsync: (input: RecipeIngredientInput) => mutation.mutateAsync({ recipeId, ...input })
  };
}

export function useUpdateIngredient(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.updateIngredient);

  return {
    ...mutation,
    mutateAsync: ({ ingredientId, input }: { ingredientId: string; input: Partial<RecipeIngredientInput> }) =>
      mutation.mutateAsync({ ingredientId, ...input })
  };
}

export function useDeleteIngredient(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.deleteIngredient);

  return {
    ...mutation,
    mutateAsync: (ingredientId: string) => mutation.mutateAsync({ ingredientId })
  };
}

export function useResetIngredients(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.resetIngredients);

  return {
    ...mutation,
    mutateAsync: () => mutation.mutateAsync({ recipeId })
  };
}
