import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/utils';

describe('RecipeDetailPage', () => {
  it('tracks ingredient purchases and can reset them', async () => {
    const user = userEvent.setup();

    renderApp('/recipes/recipe-1');

    expect(await screen.findByRole('heading', { name: 'Sourdough Loaf' })).toBeInTheDocument();
    expect(screen.getByText(/bread flour/i)).toBeInTheDocument();
    expect(screen.getByText('0 bought')).toBeInTheDocument();
    expect(screen.getByText('1 missing')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark bread flour as bought/i }));

    expect(await screen.findByText('1 bought')).toBeInTheDocument();
    expect(screen.getByText('0 missing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark bread flour as missing/i })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /reset ingredients/i }));

    expect(await screen.findByText('0 bought')).toBeInTheDocument();
    expect(screen.getByText('1 missing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark bread flour as bought/i })).toHaveAttribute('aria-pressed', 'false');
  });

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
