import type { AuthUser } from './auth-types';

type ConvexAuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

type BetterAuthSessionState = {
  data:
    | {
        session: unknown;
        user: AuthUser | null;
      }
    | null
    | undefined;
  error: unknown;
  refetch: unknown;
};

export function resolveAuthSessionState(convexAuth: ConvexAuthState, betterAuthSession: BetterAuthSessionState) {
  const sessionData = convexAuth.isAuthenticated ? betterAuthSession.data : null;

  return {
    session: sessionData?.session ?? null,
    user: (sessionData?.user as AuthUser | null | undefined) ?? null,
    error: betterAuthSession.error,
    isLoading: convexAuth.isLoading,
    isAuthenticated: convexAuth.isAuthenticated,
    refetch: betterAuthSession.refetch
  };
}
