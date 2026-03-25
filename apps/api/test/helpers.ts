import type { FastifyInstance } from "fastify";

import { createApp } from "../src/app";

type RecipeRecord = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type IngredientRecord = {
  id: string;
  recipeId: string;
  position: number;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StepRecord = {
  id: string;
  recipeId: string;
  position: number;
  title: string;
  instructions: string | null;
  timerDurationSeconds: number | null;
  timerStartedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const fixedNow = new Date("2026-03-25T12:00:00.000Z");

const sortIngredients = (ingredients: IngredientRecord[]) => [...ingredients].sort((left, right) => left.position - right.position);
const sortSteps = (steps: StepRecord[]) => [...steps].sort((left, right) => left.position - right.position);

const cloneRecipe = (recipe: RecipeRecord, ingredients: IngredientRecord[], steps: StepRecord[]) => ({
  ...recipe,
  createdAt: new Date(recipe.createdAt),
  updatedAt: new Date(recipe.updatedAt),
  ingredients: sortIngredients(ingredients).map((ingredient) => ({
    ...ingredient,
    createdAt: new Date(ingredient.createdAt),
    updatedAt: new Date(ingredient.updatedAt)
  })),
  steps: sortSteps(steps).map((step) => ({
    ...step,
    createdAt: new Date(step.createdAt),
    updatedAt: new Date(step.updatedAt),
    timerStartedAt: step.timerStartedAt ? new Date(step.timerStartedAt) : null,
    completedAt: step.completedAt ? new Date(step.completedAt) : null
  }))
});

function createPrismaDouble() {
  const recipes = new Map<string, RecipeRecord>();
  const ingredients = new Map<string, IngredientRecord>();
  const steps = new Map<string, StepRecord>();
  let recipeCount = 1;
  let ingredientCount = 1;
  let stepCount = 1;

  const tx = {
    recipe: {
      findMany: async () =>
        [...recipes.values()]
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .map((recipe) =>
            cloneRecipe(
              recipe,
              [...ingredients.values()].filter((ingredient) => ingredient.recipeId === recipe.id),
              [...steps.values()].filter((step) => step.recipeId === recipe.id)
            )
          ),
      create: async ({ data }: { data: { title: string; description?: string | null } }) => {
        const recipe: RecipeRecord = {
          id: `recipe-${recipeCount++}`,
          title: data.title,
          description: data.description ?? null,
          createdAt: new Date(fixedNow),
          updatedAt: new Date(fixedNow)
        };

        recipes.set(recipe.id, recipe);
        return cloneRecipe(recipe, [], []);
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const recipe = recipes.get(where.id);
        if (!recipe) {
          return null;
        }

        return cloneRecipe(
          recipe,
          [...ingredients.values()].filter((ingredient) => ingredient.recipeId === recipe.id),
          [...steps.values()].filter((step) => step.recipeId === recipe.id)
        );
      },
      update: async ({ where, data }: { where: { id: string }; data: { title?: string; description?: string | null } }) => {
        const recipe = recipes.get(where.id);
        if (!recipe) {
          throw new Error("Recipe not found");
        }

        if (data.title !== undefined) {
          recipe.title = data.title;
        }

        if (data.description !== undefined) {
          recipe.description = data.description;
        }

        recipe.updatedAt = new Date(fixedNow);
        recipes.set(recipe.id, recipe);
        return cloneRecipe(
          recipe,
          [...ingredients.values()].filter((ingredient) => ingredient.recipeId === recipe.id),
          [...steps.values()].filter((step) => step.recipeId === recipe.id)
        );
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const recipe = recipes.get(where.id);
        if (!recipe) {
          throw new Error("Recipe not found");
        }

        recipes.delete(where.id);
        for (const ingredient of [...ingredients.values()].filter((item) => item.recipeId === where.id)) {
          ingredients.delete(ingredient.id);
        }
        for (const step of [...steps.values()].filter((item) => item.recipeId === where.id)) {
          steps.delete(step.id);
        }

        return recipe;
      }
    },
    recipeIngredient: {
      count: async ({ where }: { where: { recipeId: string } }) =>
        [...ingredients.values()].filter((ingredient) => ingredient.recipeId === where.recipeId).length,
      updateMany: async ({
        where,
        data
      }: {
        where: { recipeId: string; position: { gte?: number; gt?: number; lte?: number; lt?: number } };
        data: { position: { increment?: number; decrement?: number } };
      }) => {
        const matches = [...ingredients.values()].filter((ingredient) => {
          if (ingredient.recipeId !== where.recipeId) {
            return false;
          }

          const position = where.position;
          if (position.gte !== undefined && ingredient.position < position.gte) {
            return false;
          }
          if (position.gt !== undefined && ingredient.position <= position.gt) {
            return false;
          }
          if (position.lte !== undefined && ingredient.position > position.lte) {
            return false;
          }
          if (position.lt !== undefined && ingredient.position >= position.lt) {
            return false;
          }
          return true;
        });

        for (const ingredient of matches) {
          if (data.position.increment !== undefined) {
            ingredient.position += data.position.increment;
          }
          if (data.position.decrement !== undefined) {
            ingredient.position -= data.position.decrement;
          }
          ingredient.updatedAt = new Date(fixedNow);
          ingredients.set(ingredient.id, ingredient);
        }

        return { count: matches.length };
      },
      create: async ({
        data
      }: {
        data: {
          recipeId: string;
          name: string;
          quantity: number;
          unit: string;
          notes?: string | null;
          position: number;
        };
      }) => {
        const ingredient: IngredientRecord = {
          id: `ingredient-${ingredientCount++}`,
          recipeId: data.recipeId,
          name: data.name,
          quantity: data.quantity,
          unit: data.unit,
          notes: data.notes ?? null,
          position: data.position,
          createdAt: new Date(fixedNow),
          updatedAt: new Date(fixedNow)
        };

        ingredients.set(ingredient.id, ingredient);
        return {
          ...ingredient,
          createdAt: new Date(ingredient.createdAt),
          updatedAt: new Date(ingredient.updatedAt)
        };
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const ingredient = ingredients.get(where.id);
        if (!ingredient) {
          return null;
        }

        return {
          ...ingredient,
          createdAt: new Date(ingredient.createdAt),
          updatedAt: new Date(ingredient.updatedAt)
        };
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: Partial<Pick<IngredientRecord, "name" | "quantity" | "unit" | "notes" | "position">>;
      }) => {
        const ingredient = ingredients.get(where.id);
        if (!ingredient) {
          throw new Error("Ingredient not found");
        }

        if (data.name !== undefined) {
          ingredient.name = data.name;
        }
        if (data.quantity !== undefined) {
          ingredient.quantity = data.quantity;
        }
        if (data.unit !== undefined) {
          ingredient.unit = data.unit;
        }
        if (data.notes !== undefined) {
          ingredient.notes = data.notes;
        }
        if (data.position !== undefined) {
          ingredient.position = data.position;
        }

        ingredient.updatedAt = new Date(fixedNow);
        ingredients.set(ingredient.id, ingredient);
        return {
          ...ingredient,
          createdAt: new Date(ingredient.createdAt),
          updatedAt: new Date(ingredient.updatedAt)
        };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const ingredient = ingredients.get(where.id);
        if (!ingredient) {
          throw new Error("Ingredient not found");
        }

        ingredients.delete(where.id);
        return ingredient;
      }
    },
    recipeStep: {
      count: async ({ where }: { where: { recipeId: string } }) =>
        [...steps.values()].filter((step) => step.recipeId === where.recipeId).length,
      updateMany: async ({
        where,
        data
      }: {
        where: { recipeId: string; position: { gte?: number; gt?: number; lte?: number; lt?: number } };
        data: { position: { increment?: number; decrement?: number } };
      }) => {
        const matches = [...steps.values()].filter((step) => {
          if (step.recipeId !== where.recipeId) {
            return false;
          }

          const position = where.position;
          if (position.gte !== undefined && step.position < position.gte) {
            return false;
          }
          if (position.gt !== undefined && step.position <= position.gt) {
            return false;
          }
          if (position.lte !== undefined && step.position > position.lte) {
            return false;
          }
          if (position.lt !== undefined && step.position >= position.lt) {
            return false;
          }
          return true;
        });

        for (const step of matches) {
          if (data.position.increment !== undefined) {
            step.position += data.position.increment;
          }
          if (data.position.decrement !== undefined) {
            step.position -= data.position.decrement;
          }
          step.updatedAt = new Date(fixedNow);
          steps.set(step.id, step);
        }

        return { count: matches.length };
      },
      create: async ({
        data
      }: {
        data: {
          recipeId: string;
          title: string;
          instructions?: string | null;
          timerDurationSeconds?: number | null;
          position: number;
        };
      }) => {
        const step: StepRecord = {
          id: `step-${stepCount++}`,
          recipeId: data.recipeId,
          title: data.title,
          instructions: data.instructions ?? null,
          timerDurationSeconds: data.timerDurationSeconds ?? null,
          position: data.position,
          timerStartedAt: null,
          completedAt: null,
          createdAt: new Date(fixedNow),
          updatedAt: new Date(fixedNow)
        };

        steps.set(step.id, step);
        return {
          ...step,
          createdAt: new Date(step.createdAt),
          updatedAt: new Date(step.updatedAt),
          timerStartedAt: null,
          completedAt: null
        };
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const step = steps.get(where.id);
        if (!step) {
          return null;
        }

        return {
          ...step,
          createdAt: new Date(step.createdAt),
          updatedAt: new Date(step.updatedAt),
          timerStartedAt: step.timerStartedAt ? new Date(step.timerStartedAt) : null,
          completedAt: step.completedAt ? new Date(step.completedAt) : null
        };
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: Partial<Pick<StepRecord, "title" | "instructions" | "timerDurationSeconds" | "position" | "timerStartedAt" | "completedAt">>;
      }) => {
        const step = steps.get(where.id);
        if (!step) {
          throw new Error("Step not found");
        }

        if (data.title !== undefined) {
          step.title = data.title;
        }
        if (data.instructions !== undefined) {
          step.instructions = data.instructions;
        }
        if (data.timerDurationSeconds !== undefined) {
          step.timerDurationSeconds = data.timerDurationSeconds;
        }
        if (data.position !== undefined) {
          step.position = data.position;
        }
        if (data.timerStartedAt !== undefined) {
          step.timerStartedAt = data.timerStartedAt === null ? null : new Date(fixedNow);
        }
        if (data.completedAt !== undefined) {
          step.completedAt = data.completedAt === null ? null : new Date(fixedNow);
        }

        step.updatedAt = new Date(fixedNow);
        steps.set(step.id, step);
        return {
          ...step,
          createdAt: new Date(step.createdAt),
          updatedAt: new Date(step.updatedAt),
          timerStartedAt: step.timerStartedAt ? new Date(step.timerStartedAt) : null,
          completedAt: step.completedAt ? new Date(step.completedAt) : null
        };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const step = steps.get(where.id);
        if (!step) {
          throw new Error("Step not found");
        }

        steps.delete(where.id);
        return step;
      }
    }
  };

  return {
    ...tx,
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx)
  };
}

export async function createTestApp(): Promise<{
  app: FastifyInstance;
}> {
  const app = createApp(createPrismaDouble() as never);

  await app.ready();

  return { app };
}
