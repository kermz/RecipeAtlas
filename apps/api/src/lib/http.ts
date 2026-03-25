import { z } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

export const parseOrThrow = <T>(schema: z.ZodSchema<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new HttpError(result.error.flatten().formErrors.join(", ") || "Invalid request", 400);
  }

  return result.data;
};
