import { describe, expect, it } from 'bun:test';
import { getAuthCallbackUrl, getAuthErrorMessage } from './auth-actions-helpers';

describe('auth-actions', () => {
  it('keeps the callback URL rooted at /recipes', () => {
    expect(getAuthCallbackUrl()).toBe('http://localhost/recipes');
  });

  it('preserves passkey cancellation error mapping', () => {
    expect(
      getAuthErrorMessage(
        {
          message: 'auth cancelled'
        },
        'Could not sign in with a passkey'
      )
    ).toBe(
      'Passkey sign-in was cancelled, or this passkey belongs to a different site or environment. Try the same site you used when adding it, or sign in with email and password and register a new passkey here.'
    );
  });
});
