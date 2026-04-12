import { useEffect, useState } from 'react';
import type { Passkey } from '@better-auth/passkey';
import { authClient } from '../../lib/auth-client';
import { getAuthErrorMessage } from './auth-actions-helpers';

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
