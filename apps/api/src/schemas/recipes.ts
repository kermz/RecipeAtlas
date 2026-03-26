import { z } from "zod";

export const recipeBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional().nullable()
});

export const recipeIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const recipeStepRecipeParamsSchema = z.object({
  recipeId: z.string().min(1)
});

export const recipeIngredientRecipeParamsSchema = z.object({
  recipeId: z.string().min(1)
});

export const stepIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const ingredientIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const stepBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  instructions: z.string().trim().max(4000).optional().nullable(),
  position: z.coerce.number().int().positive().optional(),
  timerDurationSeconds: z.coerce.number().int().min(1).max(24 * 60 * 60).optional().nullable()
});

export const stepUpdateSchema = stepBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export const ingredientUnitSchema = z.enum([
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "tsp",
  "Tbs",
  "cup",
  "fl-oz",
  "pcs"
]);

export const ingredientBodySchema = z.object({
  name: z.string().trim().min(1, "Ingredient name is required").max(160),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(100000),
  unit: ingredientUnitSchema,
  notes: z.string().trim().max(1000).optional().nullable(),
  purchased: z.boolean().optional(),
  position: z.coerce.number().int().positive().optional()
});

export const ingredientUpdateSchema = ingredientBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);
