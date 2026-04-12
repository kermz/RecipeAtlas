import { createApi } from "@convex-dev/better-auth";
import schema from "./schema";
import { createAuthOptions } from "../auth";

const betterAuthApi: ReturnType<typeof createApi> = createApi(schema, createAuthOptions);

export const create: typeof betterAuthApi.create = betterAuthApi.create;
export const findOne: typeof betterAuthApi.findOne = betterAuthApi.findOne;
export const findMany: typeof betterAuthApi.findMany = betterAuthApi.findMany;
export const updateOne: typeof betterAuthApi.updateOne = betterAuthApi.updateOne;
export const updateMany: typeof betterAuthApi.updateMany = betterAuthApi.updateMany;
export const deleteOne: typeof betterAuthApi.deleteOne = betterAuthApi.deleteOne;
export const deleteMany: typeof betterAuthApi.deleteMany = betterAuthApi.deleteMany;
