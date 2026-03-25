import type { FastifyPluginAsync } from "fastify";

import { HttpError, parseOrThrow } from "../lib/http";
import { stepBodySchema, stepIdParamsSchema, stepUpdateSchema } from "../schemas/recipes";
import type { AppPrisma } from "../types";
import { clampPosition } from "../utils/step-order";

type StepRoutesOptions = {
  prisma: AppPrisma;
};

export const registerStepRoutes: FastifyPluginAsync<StepRoutesOptions> = async (app, options) => {
  const { prisma } = options;

  app.patch("/:id", async (request) => {
    const { id } = parseOrThrow(stepIdParamsSchema, request.params);
    const body = parseOrThrow(stepUpdateSchema, request.body);

    const current = await prisma.recipeStep.findUnique({ where: { id } });
    if (!current) {
      throw new HttpError("Step not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      const siblingCount = await tx.recipeStep.count({ where: { recipeId: current.recipeId } });
      const nextPosition =
        body.position === undefined
          ? current.position
          : clampPosition(body.position, 1, siblingCount);

      if (nextPosition < current.position) {
        await tx.recipeStep.updateMany({
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
        await tx.recipeStep.updateMany({
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

      return tx.recipeStep.update({
        where: { id },
        data: {
          title: body.title,
          instructions: body.instructions,
          timerDurationSeconds: body.timerDurationSeconds,
          position: nextPosition
        }
      });
    });
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = parseOrThrow(stepIdParamsSchema, request.params);

    const existing = await prisma.recipeStep.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError("Step not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipeStep.delete({ where: { id } });
      await tx.recipeStep.updateMany({
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

  app.post("/:id/complete", async (request) => {
    const { id } = parseOrThrow(stepIdParamsSchema, request.params);

    const step = await prisma.recipeStep.update({
      where: { id },
      data: { completedAt: new Date() }
    }).catch(() => null);

    if (!step) {
      throw new HttpError("Step not found", 404);
    }

    return step;
  });

  app.post("/:id/start-timer", async (request) => {
    const { id } = parseOrThrow(stepIdParamsSchema, request.params);

    const step = await prisma.recipeStep.update({
      where: { id },
      data: { timerStartedAt: new Date() }
    }).catch(() => null);

    if (!step) {
      throw new HttpError("Step not found", 404);
    }

    return step;
  });

  app.post("/:id/reset", async (request) => {
    const { id } = parseOrThrow(stepIdParamsSchema, request.params);

    const step = await prisma.recipeStep.update({
      where: { id },
      data: { completedAt: null, timerStartedAt: null }
    }).catch(() => null);

    if (!step) {
      throw new HttpError("Step not found", 404);
    }

    return step;
  });
};
