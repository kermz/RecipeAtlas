import { describe, expect, it, mock } from 'bun:test';
import { screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authHooksMock from '../test/mocks/auth-hooks';
import * as ingredientHooksMock from '../test/mocks/ingredients-hooks';
import * as recipeStepHooksMock from '../test/mocks/recipe-steps-hooks';
import * as recipeHooksMock from '../test/mocks/recipes-hooks';

async function loadRenderApp() {
  mock.module('../features/auth/hooks', () => authHooksMock);
  mock.module('../features/recipes/hooks', () => recipeHooksMock);
  mock.module('../features/ingredients/hooks', () => ingredientHooksMock);
  mock.module('../features/recipe-steps/hooks', () => recipeStepHooksMock);

  return (await import('../test/utils')).renderApp;
}

describe('RecipeDetailPage', () => {
  it('tracks ingredient purchases and can reset them', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes/recipe-1');

    expect(await screen.findByRole('heading', { name: 'Sourdough Loaf' })).toBeInTheDocument();
    expect(screen.getByText(/bread flour/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark bread flour as bought/i })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: /mark bread flour as bought/i }));

    expect(screen.getByRole('button', { name: /mark bread flour as missing/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^reset$/i }));

    expect(screen.getByRole('button', { name: /mark bread flour as bought/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows steps and records completion', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes/recipe-1');

    expect(await screen.findByRole('heading', { name: 'Sourdough Loaf' })).toBeInTheDocument();
    expect(screen.getByText(/bread flour/i)).toBeInTheDocument();
    expect(screen.getByText('Mix the dough')).toBeInTheDocument();
    const stepCard = screen.getByTestId('step-step-1');
    expect(within(stepCard).getByRole('button', { name: /start/i })).toBeInTheDocument();

    await user.click(within(stepCard).getByRole('button', { name: /mark done/i }));
    expect(await within(stepCard).findByText(/^Completed /i)).toBeInTheDocument();
  });
});
