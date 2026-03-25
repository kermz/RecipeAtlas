import { formatDistanceToNow } from 'date-fns';
import { Clock3, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecipeSummary } from '../../lib/types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { Skeleton } from '../../components/ui/skeleton';
import { formatRecipeTotalTime } from './total-time';

type RecipeListProps = {
  recipes?: RecipeSummary[];
  isLoading: boolean;
  onCreate: () => void;
};

export function RecipeList({ recipes, isLoading, onCreate }: RecipeListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <EmptyState
        title="No recipes yet"
        description="Create your first recipe and start adding ordered steps with local countdown timers."
        action={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New recipe
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {recipes.map((recipe) => (
        <Link
          key={recipe.id}
          to={`/recipes/${recipe.id}`}
          className="block rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent"
        >
          <Card className="flex h-full flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-white/20">
            <div>
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <h3 className="app-heading text-2xl font-semibold text-white">{recipe.title}</h3>
                  <p className="mt-2 max-h-20 overflow-hidden text-sm leading-6 text-slate-300">{recipe.description || 'No description yet.'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{recipe.ingredientsCount ?? recipe.ingredients?.length ?? 0} ingredients</Badge>
                  <Badge tone="accent">{recipe.stepsCount ?? recipe.steps?.length ?? 0} steps</Badge>
                  <Badge tone="neutral">{formatRecipeTotalTime(recipe)}</Badge>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <Clock3 className="h-3.5 w-3.5" />
                Updated {formatDistanceToNow(new Date(recipe.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
