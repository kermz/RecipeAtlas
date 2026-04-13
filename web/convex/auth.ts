import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

const defaultSiteUrl = "http://localhost:5173";

function parseOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getRpId(origin: string) {
  return new URL(origin).hostname;
}

const siteUrl = process.env.SITE_URL ?? defaultSiteUrl;
const trustedOrigins = Array.from(new Set([siteUrl, ...parseOrigins(process.env.TRUSTED_ORIGINS)]));
const passkeyRpId = getRpId(siteUrl);

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema
  }
});

export function createAuthOptions(ctx: GenericCtx<DataModel>) {
  return {
    appName: "Recipe Atlas",
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    plugins: [
      passkey({
        rpID: passkeyRpId,
        rpName: "Recipe Atlas"
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig })
    ]
  } satisfies BetterAuthOptions;
}

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  }
});
