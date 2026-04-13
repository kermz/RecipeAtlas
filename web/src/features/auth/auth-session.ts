import { useConvexAuth } from 'convex/react';
import { authClient } from '../../lib/auth-client';
import { resolveAuthSessionState } from './auth-session-state';

/*
 * Auth loading and authenticated status come from the ConvexBetterAuthProvider.
 * Better Auth's session hook only supplies the richer session and user payload.
 */
export function useAuthSession() {
  return resolveAuthSessionState(useConvexAuth(), authClient.useSession());
}
