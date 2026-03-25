import { z } from "zod";

export const stepIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const createRecipeStepBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(5000).nullish(),
  position: z.number().int().positive(),
  timerDurationSeconds: z.number().int().positive().nullish()
});

export const updateRecipeStepBodySchema = createRecipeStepBodySchema.partial().refine((value) => {
  return Object.values(value).some((entry) => entry !== undefined);
}, {
  message: "At least one field must be provided"
});

export type CreateRecipeStepBody = z.infer<typeof createRecipeStepBodySchema>;
export type UpdateRecipeStepBody = z.infer<typeof updateRecipeStepBodySchema>;
