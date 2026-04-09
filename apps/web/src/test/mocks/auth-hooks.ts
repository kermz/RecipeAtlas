import { mockAuthActions, useMockRecipeStore } from '../mock-recipe-store';

export function useAuthSession() {
  const session = useMockRecipeStore(() => mockAuthActions.getSession());

  return {
    session: session?.session ?? null,
    user: session?.user ?? null,
    error: null,
    isLoading: false,
    isAuthenticated: Boolean(session?.session),
    refetch: async () => session
  };
}

export function useAuthActions() {
  return {
    signIn: mockAuthActions.signIn.bind(mockAuthActions),
    signUp: mockAuthActions.signUp.bind(mockAuthActions),
    signOut: mockAuthActions.signOut.bind(mockAuthActions)
  };
}
