import type { PrismaClient } from "@prisma/client";

export type AppPrisma = Pick<
  PrismaClient,
  "$transaction" | "recipe" | "recipeIngredient" | "recipeStep"
>;
