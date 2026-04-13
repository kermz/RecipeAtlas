export function getAuthCallbackUrl(path = '/recipes') {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function getAuthErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  if (error?.message === 'auth cancelled') {
    return 'Passkey sign-in was cancelled, or this passkey belongs to a different site or environment. Try the same site you used when adding it, or sign in with email and password and register a new passkey here.';
  }

  return error?.message || fallback;
}
