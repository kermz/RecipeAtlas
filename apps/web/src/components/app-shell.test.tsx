import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';
import { mockAuthActions } from '../test/mock-recipe-store';
import * as authHooksMock from '../test/mocks/auth-hooks';
import * as ingredientHooksMock from '../test/mocks/ingredients-hooks';
import * as recipeStepHooksMock from '../test/mocks/recipe-steps-hooks';
import * as recipeHooksMock from '../test/mocks/recipes-hooks';

vi.mock('../features/auth/hooks', () => authHooksMock);
vi.mock('../features/recipes/hooks', () => recipeHooksMock);
vi.mock('../features/ingredients/hooks', () => ingredientHooksMock);
vi.mock('../features/recipe-steps/hooks', () => recipeStepHooksMock);

describe('AppShell', () => {
  it('opens user settings from the username button and manages passkeys there', async () => {
    const user = userEvent.setup();

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

    renderApp('/recipes/recipe-1');

    expect(screen.queryByRole('button', { name: /^sign out$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /recipe tester/i }));
    await user.click(await screen.findByRole('button', { name: /^sign out$/i }));

    expect(await screen.findByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/recipes');
  });

  it('explains the sign-in options more clearly', async () => {
    const user = userEvent.setup();

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
});
