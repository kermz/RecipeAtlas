import type { FastifyPluginAsync } from "fastify";

import { parseOrThrow, HttpError } from "../lib/http";
import {
  ingredientBodySchema,
  recipeBodySchema,
  recipeIngredientRecipeParamsSchema,
  recipeIdParamsSchema,
  recipeStepRecipeParamsSchema,
  stepBodySchema
} from "../schemas/recipes";
import type { AppPrisma } from "../types";
import { clampPosition } from "../utils/step-order";

type RecipeRoutesOptions = {
  prisma: AppPrisma;
};

export const registerRecipeRoutes: FastifyPluginAsync<RecipeRoutesOptions> = async (app, options) => {
  const { prisma } = options;

  app.get("/", async () => {
    return prisma.recipe.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ingredients: {
          orderBy: { position: "asc" }
        },
        steps: {
          orderBy: { position: "asc" }
        }
      }
    });
  });

  app.post("/", async (request, reply) => {
    const body = parseOrThrow(recipeBodySchema, request.body);

    const recipe = await prisma.recipe.create({
      data: body,
      include: {
        ingredients: {
          orderBy: { position: "asc" }
        },
        steps: {
          orderBy: { position: "asc" }
        }
      }
    });

    return reply.status(201).send(recipe);
  });

  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(recipeIdParamsSchema, request.params);

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          orderBy: { position: "asc" }
        },
        steps: {
          orderBy: { position: "asc" }
        }
      }
    });

    if (!recipe) {
      throw new HttpError("Recipe not found", 404);
    }

    return recipe;
  });

  app.patch("/:id", async (request) => {
    const { id } = parseOrThrow(recipeIdParamsSchema, request.params);
    const body = parseOrThrow(recipeBodySchema.partial(), request.body);

    const recipe = await prisma.recipe.update({
      where: { id },
      data: body,
      include: {
        ingredients: {
          orderBy: { position: "asc" }
        },
        steps: {
          orderBy: { position: "asc" }
        }
      }
    }).catch(() => null);

    if (!recipe) {
      throw new HttpError("Recipe not found", 404);
    }

    return recipe;
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = parseOrThrow(recipeIdParamsSchema, request.params);

    const recipe = await prisma.recipe.delete({
      where: { id }
    }).catch(() => null);

    if (!recipe) {
      throw new HttpError("Recipe not found", 404);
    }

    return reply.status(204).send();
  });

  app.post("/:recipeId/steps", async (request, reply) => {
    const { recipeId } = parseOrThrow(recipeStepRecipeParamsSchema, request.params);
    const body = parseOrThrow(stepBodySchema, request.body);

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      throw new HttpError("Recipe not found", 404);
    }

    const step = await prisma.$transaction(async (tx) => {
      const count = await tx.recipeStep.count({ where: { recipeId } });
      const position = clampPosition(body.position, 1, count + 1);

      await tx.recipeStep.updateMany({
        where: {
          recipeId,
          position: {
            gte: position
          }
        },
        data: {
          position: {
            increment: 1
          }
        }
      });

      return tx.recipeStep.create({
        data: {
          recipeId,
          title: body.title,
          instructions: body.instructions ?? null,
          timerDurationSeconds: body.timerDurationSeconds ?? null,
          position
        }
      });
    });

    return reply.status(201).send(step);
  });

  app.post("/:recipeId/ingredients", async (request, reply) => {
    const { recipeId } = parseOrThrow(recipeIngredientRecipeParamsSchema, request.params);
    const body = parseOrThrow(ingredientBodySchema, request.body);

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      throw new HttpError("Recipe not found", 404);
    }

    const ingredient = await prisma.$transaction(async (tx) => {
      const count = await tx.recipeIngredient.count({ where: { recipeId } });
      const position = clampPosition(body.position, 1, count + 1);

      await tx.recipeIngredient.updateMany({
        where: {
          recipeId,
          position: {
            gte: position
          }
        },
        data: {
          position: {
            increment: 1
          }
        }
      });

      return tx.recipeIngredient.create({
        data: {
          recipeId,
          name: body.name,
          quantity: body.quantity,
          unit: body.unit,
          notes: body.notes ?? null,
          position
        }
      });
    });

    return reply.status(201).send(ingredient);
  });
};
