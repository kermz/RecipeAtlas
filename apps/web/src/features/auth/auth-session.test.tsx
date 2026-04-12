import { describe, expect, it, mock } from 'bun:test';
import { resolveAuthSessionState } from './auth-session-state';

describe('useAuthSession', () => {
  it('stops loading when the provider auth state is settled', () => {
    const refetch = mock();
    const result = resolveAuthSessionState(
      {
        isLoading: false,
        isAuthenticated: false
      },
      {
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', email: 'chef@example.com', name: 'Chef' }
        },
        error: null,
        refetch
      }
    );

    expect(result.isLoading).toBe(false);
    expect(result.isAuthenticated).toBe(false);
    expect(result.session).toBeNull();
    expect(result.user).toBeNull();
    expect(result.refetch).toBe(refetch);
  });

  it('returns the Better Auth payload once the provider is authenticated', () => {
    const result = resolveAuthSessionState(
      {
        isLoading: false,
        isAuthenticated: true
      },
      {
        data: {
          session: { id: 'session-1' },
          user: { id: 'user-1', email: 'chef@example.com', name: 'Chef' }
        },
        error: null,
        refetch: mock()
      }
    );

    expect(result.session).toEqual({ id: 'session-1' });
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'chef@example.com',
      name: 'Chef'
    });
  });
});
