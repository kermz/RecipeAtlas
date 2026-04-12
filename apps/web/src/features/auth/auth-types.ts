export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type SignInWithPasskeyInput = {
  autoFill?: boolean;
};

export type AddPasskeyInput = {
  name?: string;
};

export type DeletePasskeyInput = {
  passkeyId: string;
};

export type SyncAcceptedPasskeysInput = {
  userId: string;
  acceptedCredentialIds: string[];
};
