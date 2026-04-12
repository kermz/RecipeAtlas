import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

const mocks = {
  useAuthActions: mock(),
  useAuthSession: mock(),
  usePasskeys: mock(),
  isPasskeySupported: mock(),
  syncAcceptedPasskeysOnDevice: mock()
};

async function loadPasskeySettingsPanel() {
  mock.module('./auth-actions', () => ({
    useAuthActions: mocks.useAuthActions
  }));

  mock.module('./auth-session', () => ({
    useAuthSession: mocks.useAuthSession
  }));

  mock.module('./passkey-queries', () => ({
    usePasskeys: mocks.usePasskeys
  }));

  mock.module('./passkey-browser', () => ({
    isPasskeySupported: mocks.isPasskeySupported,
    syncAcceptedPasskeysOnDevice: mocks.syncAcceptedPasskeysOnDevice
  }));

  return (await import('./passkey-settings-panel')).PasskeySettingsPanel;
}

describe('PasskeySettingsPanel', () => {
  beforeEach(() => {
    mocks.useAuthActions.mockReset();
    mocks.useAuthSession.mockReset();
    mocks.usePasskeys.mockReset();
    mocks.isPasskeySupported.mockReset();
    mocks.syncAcceptedPasskeysOnDevice.mockReset();
  });

  it('still deletes the server passkey when device sync returns false', async () => {
    const user = userEvent.setup();
    const deletePasskey = mock(() => Promise.resolve(null));
    const refetch = mock();
    const PasskeySettingsPanel = await loadPasskeySettingsPanel();

    mocks.useAuthSession.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'chef@example.com'
      }
    });
    mocks.useAuthActions.mockReturnValue({
      addPasskey: mock(),
      deletePasskey
    });
    mocks.isPasskeySupported.mockReturnValue(true);
    mocks.usePasskeys.mockReturnValue({
      data: [
        {
          id: 'passkey-1',
          name: 'Kitchen laptop',
          credentialID: 'credential-1',
          deviceType: 'singleDevice',
          backedUp: false,
          transports: 'internal',
          createdAt: new Date('2026-04-12T10:00:00Z').toISOString()
        },
        {
          id: 'passkey-2',
          name: 'Phone',
          credentialID: 'credential-2',
          deviceType: 'multiDevice',
          backedUp: true,
          transports: 'hybrid',
          createdAt: new Date('2026-04-12T10:05:00Z').toISOString()
        }
      ],
      error: null,
      isLoading: false,
      refetch
    });
    mocks.syncAcceptedPasskeysOnDevice.mockResolvedValue(false);

    render(<PasskeySettingsPanel active />);

    await user.click(screen.getAllByRole('button', { name: /^remove$/i })[0]);

    await waitFor(() => {
      expect(deletePasskey).toHaveBeenCalledWith({ passkeyId: 'passkey-1' });
    });

    expect(mocks.syncAcceptedPasskeysOnDevice).toHaveBeenCalledWith({
      userId: 'user-1',
      acceptedCredentialIds: ['credential-2']
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/could not remove the passkey/i)).not.toBeInTheDocument();
  });
});
