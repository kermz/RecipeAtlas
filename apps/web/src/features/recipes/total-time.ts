import type { RecipeDetail, RecipeSummary } from '../../lib/types';
import { formatDuration } from '../recipe-steps/time-format';

export function getRecipeTotalTimeSeconds(recipe: Pick<RecipeSummary, 'steps'> | Pick<RecipeDetail, 'steps'>) {
  return (recipe.steps ?? []).reduce((total, step) => total + (step.timerDurationSeconds ?? 0), 0);
}

export function formatRecipeTotalTime(recipe: Pick<RecipeSummary, 'steps'> | Pick<RecipeDetail, 'steps'>) {
  const totalSeconds = getRecipeTotalTimeSeconds(recipe);

  if (totalSeconds <= 0) {
    return 'No timers';
  }

  return formatDuration(totalSeconds);
}
