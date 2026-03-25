import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";

import { HttpError } from "./lib/http";
import { prisma as defaultPrisma } from "./lib/prisma";
import { registerIngredientRoutes } from "./routes/ingredients";
import { registerRecipeRoutes } from "./routes/recipes";
import { registerStepRoutes } from "./routes/steps";
import type { AppPrisma } from "./types";

export const createApp = (prisma: AppPrisma = defaultPrisma) => {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(registerRecipeRoutes, { prefix: "/recipes", prisma });
  app.register(registerIngredientRoutes, { prefix: "/ingredients", prisma });
  app.register(registerStepRoutes, { prefix: "/steps", prisma });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({ message: error.flatten().formErrors.join(", ") || "Invalid request" });
    }

    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error" });
  });

  return app;
};
