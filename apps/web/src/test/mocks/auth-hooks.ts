import { mockAuthActions, useMockRecipeStore } from '../mock-recipe-store';

export function isPasskeySupported() {
  return true;
}

export async function syncAcceptedPasskeysOnDevice() {
  return true;
}

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
    signInWithPasskey: mockAuthActions.signInWithPasskey.bind(mockAuthActions),
    signUp: mockAuthActions.signUp.bind(mockAuthActions),
    addPasskey: mockAuthActions.addPasskey.bind(mockAuthActions),
    deletePasskey: ({ passkeyId }: { passkeyId: string }) => mockAuthActions.deletePasskey(passkeyId),
    signOut: mockAuthActions.signOut.bind(mockAuthActions)
  };
}

export function usePasskeys(enabled: boolean) {
  const data = useMockRecipeStore(() => (enabled ? mockAuthActions.listPasskeys() : []));

  return {
    data,
    error: null,
    isLoading: false,
    refetch: () => undefined
  };
}
