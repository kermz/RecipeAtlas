import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "./errors";
import type {
  RecipeCreateInput,
  RecipeRecord,
  RecipeRepository,
  RecipeStepCreateInput,
  RecipeStepRecord,
  RecipeStepUpdateInput,
  RecipeUpdateInput
} from "./types";

function now(): Date {
  return new Date();
}

function cloneRecipe(recipe: RecipeRecord): RecipeRecord {
  return {
    ...recipe,
    createdAt: new Date(recipe.createdAt),
    updatedAt: new Date(recipe.updatedAt)
  };
}

function cloneStep(step: RecipeStepRecord): RecipeStepRecord {
  return {
    ...step,
    createdAt: new Date(step.createdAt),
    updatedAt: new Date(step.updatedAt),
    completedAt: step.completedAt ? new Date(step.completedAt) : null
  };
}

function sortSteps(steps: RecipeStepRecord[]): RecipeStepRecord[] {
  return [...steps].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    if (left.createdAt.getTime() !== right.createdAt.getTime()) {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }

    return left.id.localeCompare(right.id);
  });
}

export function createInMemoryRepository(): RecipeRepository {
  const recipes = new Map<string, RecipeRecord>();
  const steps = new Map<string, RecipeStepRecord>();

  return {
    async listRecipes() {
      return [...recipes.values()]
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || left.id.localeCompare(right.id))
        .map(cloneRecipe);
    },

    async findRecipeById(id: string) {
      const recipe = recipes.get(id);
      return recipe ? cloneRecipe(recipe) : null;
    },

    async createRecipe(input: RecipeCreateInput & { title: string; description: string | null }) {
      const recipe: RecipeRecord = {
        id: randomUUID(),
        title: input.title,
        description: input.description ?? null,
        createdAt: now(),
        updatedAt: now()
      };

      recipes.set(recipe.id, recipe);
      return cloneRecipe(recipe);
    },

    async updateRecipe(id: string, input: RecipeUpdateInput) {
      const existing = recipes.get(id);

      if (!existing) {
        return null;
      }

      if (input.title !== undefined) {
        existing.title = input.title;
      }

      if (input.description !== undefined) {
        existing.description = input.description;
      }

      existing.updatedAt = now();
      recipes.set(id, existing);

      return cloneRecipe(existing);
    },

    async deleteRecipe(id: string) {
      const existed = recipes.delete(id);

      if (existed) {
        const stepIdsToDelete = [...steps.values()]
          .filter((step) => step.recipeId === id)
          .map((step) => step.id);

        for (const stepId of stepIdsToDelete) {
          steps.delete(stepId);
        }
      }

      return existed;
    },

    async listStepsByRecipe(recipeId: string) {
      return sortSteps([...steps.values()].filter((step) => step.recipeId === recipeId)).map(cloneStep);
    },

    async findStepById(id: string) {
      const step = steps.get(id);
      return step ? cloneStep(step) : null;
    },

    async createStep(recipeId: string, input: RecipeStepCreateInput & { title: string; position: number; instructions: string | null; timerDurationSeconds: number | null }) {
      if (!recipes.has(recipeId)) {
        throw new NotFoundError("Recipe not found");
      }

      const step: RecipeStepRecord = {
        id: randomUUID(),
        recipeId,
        position: input.position,
        title: input.title,
        instructions: input.instructions ?? null,
        timerDurationSeconds: input.timerDurationSeconds ?? null,
        completedAt: null,
        createdAt: now(),
        updatedAt: now()
      };

      steps.set(step.id, step);
      return cloneStep(step);
    },

    async updateStep(id: string, input: RecipeStepUpdateInput) {
      const existing = steps.get(id);

      if (!existing) {
        return null;
      }

      if (input.title !== undefined) {
        existing.title = input.title;
      }

      if (input.instructions !== undefined) {
        existing.instructions = input.instructions;
      }

      if (input.timerDurationSeconds !== undefined) {
        existing.timerDurationSeconds = input.timerDurationSeconds;
      }

      if (input.completedAt !== undefined) {
        existing.completedAt = input.completedAt;
      }

      existing.updatedAt = now();
      steps.set(id, existing);

      return cloneStep(existing);
    },

    async deleteStep(id: string) {
      return steps.delete(id);
    },

    async replaceRecipeStepOrder(recipeId: string, orderedStepIds: string[]) {
      const recipeSteps = sortSteps([...steps.values()].filter((step) => step.recipeId === recipeId));
      const orderedStepIdSet = new Set(orderedStepIds);

      if (orderedStepIdSet.size !== orderedStepIds.length) {
        throw new BadRequestError("Step order contains duplicate step ids");
      }

      if (recipeSteps.length !== orderedStepIds.length) {
        throw new BadRequestError("Step order does not match recipe contents");
      }

      const stepIdSet = new Set(recipeSteps.map((step) => step.id));

      for (const stepId of orderedStepIds) {
        if (!stepIdSet.has(stepId)) {
          throw new BadRequestError("Step order contains a step that does not belong to the recipe");
        }
      }

      for (const [index, stepId] of orderedStepIds.entries()) {
        const step = steps.get(stepId);

        if (!step) {
          throw new BadRequestError("Step order references a missing step");
        }

        step.position = index + 1;
        step.updatedAt = now();
        steps.set(step.id, step);
      }
    }
  };
}
