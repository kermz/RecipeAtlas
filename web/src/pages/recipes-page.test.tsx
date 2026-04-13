import { describe, expect, it, mock } from 'bun:test';
import { screen } from '@testing-library/react';
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

describe('RecipesPage', () => {
  it('renders recipes and creates a new one', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes');

    expect(await screen.findByText('Sourdough Loaf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recipe/i }));
    await user.type(screen.getByLabelText(/recipe title/i), 'Pasta Night');
    await user.type(screen.getByLabelText(/description/i), 'Fresh basil and tomato sauce');
    await user.click(screen.getByRole('button', { name: /create recipe/i }));

    expect(await screen.findByRole('heading', { name: /pasta night/i })).toBeInTheDocument();
  });

  it('deletes an existing recipe', async () => {
    const user = userEvent.setup();
    const renderApp = await loadRenderApp();

    renderApp('/recipes');

    expect(await screen.findByText('Sourdough Loaf')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /sourdough loaf/i }));
    await user.click(await screen.findByRole('button', { name: /edit mode/i }));
    await user.click(await screen.findByRole('button', { name: /edit recipe/i }));
    await user.click(screen.getByRole('button', { name: /delete recipe/i }));
    await user.click(screen.getAllByRole('button', { name: /delete recipe/i }).at(-1)!);

    expect(await screen.findByText(/no recipes yet/i)).toBeInTheDocument();
  });
});
