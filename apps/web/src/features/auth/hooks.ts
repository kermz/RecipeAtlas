import { authClient } from '../../lib/auth-client';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function useAuthSession() {
  const { data, error, isPending, refetch } = authClient.useSession();

  return {
    session: data?.session ?? null,
    user: (data?.user as AuthUser | null | undefined) ?? null,
    error,
    isLoading: isPending,
    isAuthenticated: Boolean(data?.session),
    refetch
  };
}

export function useAuthActions() {
  return {
    signIn: async (input: { email: string; password: string }) => {
      const result = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        callbackURL: "/recipes"
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    signUp: async (input: { name: string; email: string; password: string }) => {
      const result = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: "/recipes"
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    signOut: async () => {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    }
  };
}
