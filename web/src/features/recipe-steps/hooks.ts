import { api } from '../../../convex/_generated/api';
import type { RecipeStepInput } from '../../lib/types';
import { useConvexMutation } from '../../lib/use-convex-mutation';

export function useCreateStep(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.createStep);

  return {
    ...mutation,
    mutateAsync: (input: RecipeStepInput) => mutation.mutateAsync({ recipeId, ...input })
  };
}

export function useUpdateStep(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.updateStep);

  return {
    ...mutation,
    mutateAsync: ({ stepId, input }: { stepId: string; input: Partial<RecipeStepInput> }) =>
      mutation.mutateAsync({ stepId, ...input })
  };
}

export function useDeleteStep(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.deleteStep);

  return {
    ...mutation,
    mutateAsync: (stepId: string) => mutation.mutateAsync({ stepId })
  };
}

export function useCompleteStep(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.completeStep);

  return {
    ...mutation,
    mutateAsync: (stepId: string) => mutation.mutateAsync({ stepId })
  };
}

export function useStartStepTimer(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.startStepTimer);

  return {
    ...mutation,
    mutateAsync: (stepId: string) => mutation.mutateAsync({ stepId })
  };
}

export function useResetStep(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.resetStep);

  return {
    ...mutation,
    mutateAsync: (stepId: string) => mutation.mutateAsync({ stepId })
  };
}

export function useResetAllSteps(recipeId: string) {
  const mutation = useConvexMutation(api.recipes.resetAllSteps);

  return {
    ...mutation,
    mutateAsync: () => mutation.mutateAsync({ recipeId })
  };
}
