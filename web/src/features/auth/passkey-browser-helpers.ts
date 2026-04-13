import type { SyncAcceptedPasskeysInput } from './auth-types';

export type SignalAllAcceptedCredentialsOptions = {
  rpId: string;
  userId: string;
  allAcceptedCredentialIds: string[];
};

type PublicKeyCredentialWithSignals = typeof PublicKeyCredential & {
  signalAllAcceptedCredentials?: (options: SignalAllAcceptedCredentialsOptions) => Promise<void>;
};

type PasskeySupportDependencies = {
  isSecureContext: boolean | undefined;
  publicKeyCredential:
    | typeof PublicKeyCredential
    | PublicKeyCredentialWithSignals
    | undefined;
};

type SyncAcceptedPasskeysDependencies = {
  hasWindow: boolean;
  hasTextEncoder: boolean;
  hostname: string;
  signalAllAcceptedCredentials: ((options: SignalAllAcceptedCredentialsOptions) => Promise<void>) | null;
};

export function isPasskeySupportedForEnvironment({
  isSecureContext,
  publicKeyCredential
}: PasskeySupportDependencies) {
  return Boolean(isSecureContext) && typeof publicKeyCredential !== 'undefined';
}

export function getSignalAllAcceptedCredentialsForEnvironment({
  isSecureContext,
  publicKeyCredential
}: PasskeySupportDependencies) {
  if (!isPasskeySupportedForEnvironment({ isSecureContext, publicKeyCredential })) {
    return null;
  }

  const signalAllAcceptedCredentials = (publicKeyCredential as PublicKeyCredentialWithSignals).signalAllAcceptedCredentials;
  return typeof signalAllAcceptedCredentials === 'function' ? signalAllAcceptedCredentials.bind(publicKeyCredential) : null;
}

export function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export async function syncAcceptedPasskeysOnDeviceWithDependencies(
  input: SyncAcceptedPasskeysInput,
  dependencies: SyncAcceptedPasskeysDependencies
) {
  if (!dependencies.hasWindow || !dependencies.hasTextEncoder || !dependencies.signalAllAcceptedCredentials) {
    return false;
  }

  try {
    await dependencies.signalAllAcceptedCredentials({
      rpId: dependencies.hostname,
      userId: toBase64Url(input.userId),
      allAcceptedCredentialIds: input.acceptedCredentialIds
    });

    return true;
  } catch {
    return false;
  }
}
