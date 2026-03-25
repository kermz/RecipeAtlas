import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  HOST: z.string().default("::"),
  PORT: z.coerce.number().default(3000)
});

export const env = envSchema.parse(process.env);
