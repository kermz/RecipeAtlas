import { describe, expect, it, mock } from 'bun:test';
import {
  getSignalAllAcceptedCredentialsForEnvironment,
  isPasskeySupportedForEnvironment,
  syncAcceptedPasskeysOnDeviceWithDependencies
} from './passkey-browser-helpers';

describe('passkey-browser', () => {
  it('returns false and no-ops on unsupported browsers', async () => {
    expect(
      isPasskeySupportedForEnvironment({
        isSecureContext: false,
        publicKeyCredential: undefined
      })
    ).toBe(false);

    await expect(
      syncAcceptedPasskeysOnDeviceWithDependencies(
        {
          userId: 'user-1',
          acceptedCredentialIds: ['credential-1']
        },
        {
          hasWindow: true,
          hasTextEncoder: true,
          hostname: 'localhost',
          signalAllAcceptedCredentials: null
        }
      )
    ).resolves.toBe(false);
  });

  it('signals accepted credentials with the RP ID, encoded user ID, and remaining credentials', async () => {
    const signalAllAcceptedCredentials = mock(() => Promise.resolve(undefined));
    class MockPublicKeyCredential {}

    Object.assign(MockPublicKeyCredential, {
      signalAllAcceptedCredentials
    });

    expect(
      isPasskeySupportedForEnvironment({
        isSecureContext: true,
        publicKeyCredential: MockPublicKeyCredential as typeof PublicKeyCredential
      })
    ).toBe(true);

    const signal = getSignalAllAcceptedCredentialsForEnvironment({
      isSecureContext: true,
      publicKeyCredential: MockPublicKeyCredential as typeof PublicKeyCredential
    });

    await expect(
      syncAcceptedPasskeysOnDeviceWithDependencies(
        {
          userId: 'user-1',
          acceptedCredentialIds: ['credential-1', 'credential-2']
        },
        {
          hasWindow: true,
          hasTextEncoder: true,
          hostname: 'localhost',
          signalAllAcceptedCredentials: signal
        }
      )
    ).resolves.toBe(true);

    expect(signalAllAcceptedCredentials).toHaveBeenCalledWith({
      rpId: 'localhost',
      userId: 'dXNlci0x',
      allAcceptedCredentialIds: ['credential-1', 'credential-2']
    });
  });

  it('swallows browser WebAuthn sync errors', async () => {
    const signalAllAcceptedCredentials = mock(() => Promise.reject(new Error('sync failed')));
    class MockPublicKeyCredential {}

    Object.assign(MockPublicKeyCredential, {
      signalAllAcceptedCredentials
    });

    const signal = getSignalAllAcceptedCredentialsForEnvironment({
      isSecureContext: true,
      publicKeyCredential: MockPublicKeyCredential as typeof PublicKeyCredential
    });

    await expect(
      syncAcceptedPasskeysOnDeviceWithDependencies(
        {
          userId: 'user-1',
          acceptedCredentialIds: ['credential-1']
        },
        {
          hasWindow: true,
          hasTextEncoder: true,
          hostname: 'localhost',
          signalAllAcceptedCredentials: signal
        }
      )
    ).resolves.toBe(false);
  });
});
