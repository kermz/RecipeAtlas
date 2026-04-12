import { mockAuthActions, useMockRecipeStore } from '../mock-recipe-store';

type MockAuthHookState = {
  isLoading: boolean;
  isAuthenticated: boolean | null;
};

const defaultMockAuthHookState: MockAuthHookState = {
  isLoading: false,
  isAuthenticated: null
};

let mockAuthHookState = defaultMockAuthHookState;

export function setMockAuthHookState(nextState: Partial<MockAuthHookState>) {
  mockAuthHookState = {
    ...mockAuthHookState,
    ...nextState
  };
}

export function resetMockAuthHookState() {
  mockAuthHookState = defaultMockAuthHookState;
}

export function isPasskeySupported() {
  return true;
}

export async function syncAcceptedPasskeysOnDevice() {
  return true;
}

export function useAuthSession() {
  const session = useMockRecipeStore(() => mockAuthActions.getSession());
  const isAuthenticated = mockAuthHookState.isAuthenticated ?? Boolean(session?.session);

  return {
    session: session?.session ?? null,
    user: session?.user ?? null,
    error: null,
    isLoading: mockAuthHookState.isLoading,
    isAuthenticated,
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
