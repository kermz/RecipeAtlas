import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';

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
