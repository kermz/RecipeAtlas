import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeStep, createStep, deleteStep, resetStep, startStepTimer, updateStep } from './api';
import { recipeKeys } from '../recipes/hooks';
import type { RecipeStepInput } from '../../lib/types';

export function useCreateStep(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeStepInput) => createStep(recipeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useUpdateStep(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, input }: { stepId: string; input: Partial<RecipeStepInput> }) => updateStep(stepId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useDeleteStep(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useCompleteStep(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useStartStepTimer(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startStepTimer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useResetStep(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetStep,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}

export function useResetAllSteps(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stepIds: string[]) => {
      await Promise.all(stepIds.map((stepId) => resetStep(stepId)));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    }
  });
}
