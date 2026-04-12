import { useEffect, useState } from 'react';
import { useConvexAuth } from 'convex/react';
import type { Passkey } from '@better-auth/passkey';
import { authClient } from '../../lib/auth-client';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

type SignalAllAcceptedCredentialsOptions = {
  rpId: string;
  userId: string;
  allAcceptedCredentialIds: string[];
};

type PublicKeyCredentialWithSignals = typeof PublicKeyCredential & {
  signalAllAcceptedCredentials?: (options: SignalAllAcceptedCredentialsOptions) => Promise<void>;
};

function getCallbackUrl(path: string) {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function getAuthErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  if (error?.message === 'auth cancelled') {
    return 'Passkey sign-in was cancelled, or this passkey belongs to a different site or environment. Try the same site you used when adding it, or sign in with email and password and register a new passkey here.';
  }

  return error?.message || fallback;
}

export function isPasskeySupported() {
  return typeof window !== 'undefined' && window.isSecureContext && 'PublicKeyCredential' in window;
}

function getSignalAllAcceptedCredentials() {
  if (!isPasskeySupported()) {
    return null;
  }

  const signalAllAcceptedCredentials = (PublicKeyCredential as PublicKeyCredentialWithSignals)
    .signalAllAcceptedCredentials;

  return typeof signalAllAcceptedCredentials === 'function' ? signalAllAcceptedCredentials.bind(PublicKeyCredential) : null;
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export async function syncAcceptedPasskeysOnDevice(input: { userId: string; acceptedCredentialIds: string[] }) {
  if (typeof window === 'undefined' || typeof TextEncoder === 'undefined') {
    return false;
  }

  const signalAllAcceptedCredentials = getSignalAllAcceptedCredentials();

  if (!signalAllAcceptedCredentials) {
    return false;
  }

  try {
    await signalAllAcceptedCredentials({
      rpId: window.location.hostname,
      userId: toBase64Url(input.userId),
      allAcceptedCredentialIds: input.acceptedCredentialIds
    });

    return true;
  } catch {
    return false;
  }
}

export function useAuthSession() {
  const { data, error, refetch } = authClient.useSession();
  const { isAuthenticated, isLoading } = useConvexAuth();

  return {
    session: data?.session ?? null,
    user: (data?.user as AuthUser | null | undefined) ?? null,
    error,
    isLoading,
    isAuthenticated,
    refetch
  };
}

export function useAuthActions() {
  return {
    signIn: async (input: { email: string; password: string }) => {
      const result = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        callbackURL: getCallbackUrl('/recipes')
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not sign in'));
      }

      return result.data;
    },
    signUp: async (input: { name: string; email: string; password: string }) => {
      const result = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: getCallbackUrl('/recipes')
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not create your account'));
      }

      return result.data;
    },
    signInWithPasskey: async (input?: { autoFill?: boolean }) => {
      const result = await authClient.signIn.passkey({
        autoFill: input?.autoFill ?? false
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not sign in with a passkey'));
      }

      return result.data;
    },
    addPasskey: async (input?: { name?: string }) => {
      const result = await authClient.passkey.addPasskey({
        name: input?.name?.trim() || undefined
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not add a passkey'));
      }

      return result.data;
    },
    deletePasskey: async (input: { passkeyId: string }) => {
      const result = await authClient.passkey.deletePasskey({
        id: input.passkeyId
      });

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not remove the passkey'));
      }

      return result.data;
    },
    signOut: async () => {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(getAuthErrorMessage(result.error, 'Could not sign out'));
      }

      return result.data;
    }
  };
}

export function usePasskeys(enabled: boolean) {
  const [data, setData] = useState<Passkey[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    void authClient.passkey
      .listUserPasskeys()
      .then((result: Awaited<ReturnType<typeof authClient.passkey.listUserPasskeys>>) => {
        if (isCancelled) {
          return;
        }

        if (result.error) {
          setError(new Error(getAuthErrorMessage(result.error, 'Could not load passkeys')));
          setData([]);
          return;
        }

        setData(result.data ?? []);
      })
      .catch((nextError: unknown) => {
        if (isCancelled) {
          return;
        }

        setError(nextError instanceof Error ? nextError : new Error('Could not load passkeys'));
        setData([]);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, refreshKey]);

  return {
    data,
    error,
    isLoading,
    refetch: () => setRefreshKey((current) => current + 1)
  };
}
