import { authClient } from '../../lib/auth-client';
import type {
  AddPasskeyInput,
  DeletePasskeyInput,
  SignInInput,
  SignInWithPasskeyInput,
  SignUpInput
} from './auth-types';
import { getAuthCallbackUrl, getAuthErrorMessage } from './auth-actions-helpers';

type AuthResult<T> = {
  data?: T | null;
  error?: {
    message?: string;
  } | null;
};

async function unwrapAuthResult<T>(resultPromise: Promise<AuthResult<T>>, fallback: string) {
  const result = await resultPromise;

  if (result.error) {
    throw new Error(getAuthErrorMessage(result.error, fallback));
  }

  return result.data;
}

export async function signIn(input: SignInInput) {
  return unwrapAuthResult(
    authClient.signIn.email({
      email: input.email,
      password: input.password,
      callbackURL: getAuthCallbackUrl()
    }),
    'Could not sign in'
  );
}

export async function signUp(input: SignUpInput) {
  return unwrapAuthResult(
    authClient.signUp.email({
      name: input.name,
      email: input.email,
      password: input.password,
      callbackURL: getAuthCallbackUrl()
    }),
    'Could not create your account'
  );
}

export async function signInWithPasskey(input?: SignInWithPasskeyInput) {
  return unwrapAuthResult(
    authClient.signIn.passkey({
      autoFill: input?.autoFill ?? false
    }),
    'Could not sign in with a passkey'
  );
}

export async function addPasskey(input?: AddPasskeyInput) {
  return unwrapAuthResult(
    authClient.passkey.addPasskey({
      name: input?.name?.trim() || undefined
    }),
    'Could not add a passkey'
  );
}

export async function deletePasskey(input: DeletePasskeyInput) {
  return unwrapAuthResult(
    authClient.passkey.deletePasskey({
      id: input.passkeyId
    }),
    'Could not remove the passkey'
  );
}

export async function signOut() {
  return unwrapAuthResult(authClient.signOut(), 'Could not sign out');
}

export function useAuthActions() {
  return {
    signIn,
    signUp,
    signInWithPasskey,
    addPasskey,
    deletePasskey,
    signOut
  };
}
