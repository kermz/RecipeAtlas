import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';

describe('RecipeDetailPage', () => {
  it('shows steps and records completion', async () => {
    const user = userEvent.setup();

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
