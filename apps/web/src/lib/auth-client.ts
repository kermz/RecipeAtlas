import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL ?? convexUrl?.replace(".convex.cloud", ".convex.site");

if (!convexSiteUrl) {
  throw new Error("VITE_CONVEX_SITE_URL or VITE_CONVEX_URL is required");
}

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()]
});
