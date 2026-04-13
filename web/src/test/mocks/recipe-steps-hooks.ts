import { mockRecipeActions } from '../mock-recipe-store';

export function useCreateStep(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (input: any) => mockRecipeActions.createStep(recipeId, input)
  };
}

export function useUpdateStep(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: ({ stepId, input }: { stepId: string; input: any }) => mockRecipeActions.updateStep(stepId, input)
  };
}

export function useDeleteStep(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (stepId: string) => mockRecipeActions.deleteStep(stepId)
  };
}

export function useCompleteStep(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (stepId: string) => mockRecipeActions.completeStep(stepId)
  };
}

export function useStartStepTimer(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (stepId: string) => mockRecipeActions.startStepTimer(stepId)
  };
}

export function useResetStep(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: (stepId: string) => mockRecipeActions.resetStep(stepId)
  };
}

export function useResetAllSteps(recipeId: string) {
  return {
    isPending: false,
    mutateAsync: () => mockRecipeActions.resetAllSteps(recipeId)
  };
}
