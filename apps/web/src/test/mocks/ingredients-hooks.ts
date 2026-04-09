import { mockRecipeActions } from '../mock-recipe-store';

export function useCreateIngredient(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (input: any) => mockRecipeActions.createIngredient(recipeId, input)
  };
}

export function useUpdateIngredient(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: ({ ingredientId, input }: { ingredientId: string; input: any }) => mockRecipeActions.updateIngredient(ingredientId, input)
  };
}

export function useDeleteIngredient(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (ingredientId: string) => mockRecipeActions.deleteIngredient(ingredientId)
  };
}

export function useResetIngredients(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: () => mockRecipeActions.resetIngredients(recipeId)
  };
}
