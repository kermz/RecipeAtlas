import type { FastifyPluginAsync } from "fastify";

import { HttpError, parseOrThrow } from "../lib/http";
import { ingredientIdParamsSchema, ingredientUpdateSchema } from "../schemas/recipes";
import type { AppPrisma } from "../types";
import { clampPosition } from "../utils/step-order";

type IngredientRoutesOptions = {
  prisma: AppPrisma;
};

export const registerIngredientRoutes: FastifyPluginAsync<IngredientRoutesOptions> = async (app, options) => {
  const { prisma } = options;

  app.patch("/:id", async (request) => {
    const { id } = parseOrThrow(ingredientIdParamsSchema, request.params);
    const body = parseOrThrow(ingredientUpdateSchema, request.body);

    const current = await prisma.recipeIngredient.findUnique({ where: { id } });
    if (!current) {
      throw new HttpError("Ingredient not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      const siblingCount = await tx.recipeIngredient.count({ where: { recipeId: current.recipeId } });
      const nextPosition =
        body.position === undefined
          ? current.position
          : clampPosition(body.position, 1, siblingCount);

      if (nextPosition < current.position) {
        await tx.recipeIngredient.updateMany({
          where: {
            recipeId: current.recipeId,
            position: {
              gte: nextPosition,
              lt: current.position
            }
          },
          data: {
            position: {
              increment: 1
            }
          }
        });
      }

      if (nextPosition > current.position) {
        await tx.recipeIngredient.updateMany({
          where: {
            recipeId: current.recipeId,
            position: {
              lte: nextPosition,
              gt: current.position
            }
          },
          data: {
            position: {
              decrement: 1
            }
          }
        });
      }

      return tx.recipeIngredient.update({
        where: { id },
        data: {
          name: body.name,
          quantity: body.quantity,
          unit: body.unit,
          notes: body.notes,
          position: nextPosition
        }
      });
    });
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = parseOrThrow(ingredientIdParamsSchema, request.params);

    const existing = await prisma.recipeIngredient.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError("Ingredient not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.delete({ where: { id } });
      await tx.recipeIngredient.updateMany({
        where: {
          recipeId: existing.recipeId,
          position: {
            gt: existing.position
          }
        },
        data: {
          position: {
            decrement: 1
          }
        }
      });
    });

    return reply.status(204).send();
  });
};
