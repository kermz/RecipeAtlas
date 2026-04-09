import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';
import * as authHooksMock from '../test/mocks/auth-hooks';
import * as ingredientHooksMock from '../test/mocks/ingredients-hooks';
import * as recipeStepHooksMock from '../test/mocks/recipe-steps-hooks';
import * as recipeHooksMock from '../test/mocks/recipes-hooks';

vi.mock('../features/auth/hooks', () => authHooksMock);
vi.mock('../features/recipes/hooks', () => recipeHooksMock);
vi.mock('../features/ingredients/hooks', () => ingredientHooksMock);
vi.mock('../features/recipe-steps/hooks', () => recipeStepHooksMock);

describe('RecipesPage', () => {
  it('renders recipes and creates a new one', async () => {
    const user = userEvent.setup();

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

    renderApp('/recipes');

    expect(await screen.findByText('Sourdough Loaf')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /sourdough loaf/i }));
    await user.click(await screen.findByRole('button', { name: /edit recipe/i }));
    await user.click(screen.getByRole('button', { name: /delete recipe/i }));
    await user.click(screen.getByRole('button', { name: /delete recipe/i }));

    expect(await screen.findByText(/no recipes yet/i)).toBeInTheDocument();
  });
});
