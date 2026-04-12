import { describe, expect, it, mock } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockAuthActions } from '../test/mock-recipe-store';
import * as authHooksMock from '../test/mocks/auth-hooks';
import * as ingredientHooksMock from '../test/mocks/ingredients-hooks';
import * as recipeStepHooksMock from '../test/mocks/recipe-steps-hooks';
import * as recipeHooksMock from '../test/mocks/recipes-hooks';

async function loadRenderApp() {
  mock.module('../features/auth/hooks', () => authHooksMock);
  mock.module('../features/auth/auth-session', () => ({ useAuthSession: authHooksMock.useAuthSession }));
  mock.module('../features/auth/auth-actions', () => ({ useAuthActions: authHooksMock.useAuthActions }));
  mock.module('../features/auth/passkey-queries', () => ({ usePasskeys: authHooksMock.usePasskeys }));
  mock.module('../features/auth/passkey-browser', () => ({
    isPasskeySupported: authHooksMock.isPasskeySupported,
    syncAcceptedPasskeysOnDevice: authHooksMock.syncAcceptedPasskeysOnDevice
  }));
  mock.module('../features/recipes/hooks', () => recipeHooksMock);
  mock.module('../features/ingredients/hooks', () => ingredientHooksMock);
  mock.module('../features/recipe-steps/hooks', () => recipeStepHooksMock);

  return (await import('../test/utils')).renderApp;
}

describe('AppShell', () => {
  it('opens user settings from the username button and manages passkeys there', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes');

    expect(screen.queryByRole('button', { name: /^passkeys$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^recipes$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /recipe atlas/i })).toHaveAttribute('href', '/recipes');

    await user.click(screen.getByRole('button', { name: /recipe tester/i }));

    expect(await screen.findByRole('heading', { name: /user settings/i })).toBeInTheDocument();
    const tablist = screen.getByRole('tablist', { name: /user settings sections/i });
    expect(screen.getByRole('tab', { name: /user settings/i })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /passkeys/i }));

    expect(await screen.findByText(/registered passkeys/i)).toBeInTheDocument();
    expect(screen.getByText(/no passkeys saved yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^close$/i })).not.toBeInTheDocument();
    expect(tablist).toBeInTheDocument();
  });

  it('signs out from user settings instead of the header', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes/recipe-1');

    expect(screen.queryByRole('button', { name: /^sign out$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /recipe tester/i }));
    await user.click(await screen.findByRole('button', { name: /^sign out$/i }));

    expect(await screen.findByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/recipes');
  });

  it('explains the sign-in options more clearly', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    await mockAuthActions.signOut();
    renderApp('/recipes');

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/sign in with a passkey or your email and password/i)).toBeInTheDocument();
    expect(screen.getByText(/use a passkey on this device/i)).toBeInTheDocument();
    expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^sign in$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /^create account$/i }).length).toBeGreaterThan(0);
  });

  it('clears the checking session state when auth settles', async () => {
    const renderApp = await loadRenderApp();

    await mockAuthActions.signOut();
    authHooksMock.setMockAuthHookState({ isLoading: true });

    const view = renderApp('/recipes');
    expect(screen.getByText(/checking session/i)).toBeInTheDocument();

    authHooksMock.setMockAuthHookState({ isLoading: false });
    view.unmount();
    renderApp('/recipes');

    await waitFor(() => {
      expect(screen.queryByText(/checking session/i)).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });
});
