import { mockRecipeActions, useMockRecipeStore } from '../mock-recipe-store';

export function useRecipes() {
  const data = useMockRecipeStore(() => mockRecipeActions.listRecipes());

  return {
    data,
    isLoading: false,
    isError: false
  };
}

export function useRecipe(recipeId: string | undefined) {
  const data = useMockRecipeStore(() => (recipeId ? mockRecipeActions.getRecipe(recipeId) : undefined));

  return {
    data: data ?? undefined,
    isLoading: false,
    isError: data === null,
    isFetching: false
  };
}

export function useCreateRecipe() {
  return {
    isPending: false,
    mutateAsync: mockRecipeActions.createRecipe.bind(mockRecipeActions)
  };
}

export function useUpdateRecipe(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (input: { title?: string; description?: string | null; visibility?: 'private' | 'public' }) =>
      mockRecipeActions.updateRecipe(recipeId, input)
  };
}

export function useDeleteRecipe() {
  return {
    isPending: false,
    mutateAsync: (recipeId: string) => mockRecipeActions.deleteRecipe(recipeId)
  };
}

export function useAddRecipeCollaborator(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (email: string) => mockRecipeActions.addCollaborator(recipeId, email)
  };
}

export function useRemoveRecipeCollaborator(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (collaboratorId: string) => mockRecipeActions.removeCollaborator(recipeId, collaboratorId)
  };
}
