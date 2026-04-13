import type { SyncAcceptedPasskeysInput } from './auth-types';
import {
  getSignalAllAcceptedCredentialsForEnvironment,
  isPasskeySupportedForEnvironment,
  syncAcceptedPasskeysOnDeviceWithDependencies
} from './passkey-browser-helpers';

export function isPasskeySupported() {
  return isPasskeySupportedForEnvironment({
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : undefined,
    publicKeyCredential: typeof PublicKeyCredential === 'undefined' ? undefined : PublicKeyCredential
  });
}

function getSignalAllAcceptedCredentials() {
  return getSignalAllAcceptedCredentialsForEnvironment({
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : undefined,
    publicKeyCredential: typeof PublicKeyCredential === 'undefined' ? undefined : PublicKeyCredential
  });
}

export async function syncAcceptedPasskeysOnDevice(input: SyncAcceptedPasskeysInput) {
  return syncAcceptedPasskeysOnDeviceWithDependencies(input, {
    hasWindow: typeof window !== 'undefined',
    hasTextEncoder: typeof TextEncoder !== 'undefined',
    hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    signalAllAcceptedCredentials: getSignalAllAcceptedCredentials()
  });
}
