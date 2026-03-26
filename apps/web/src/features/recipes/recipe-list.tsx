import { useLayoutEffect, useRef } from 'react';
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
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const previousRects = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();

    for (const recipe of recipes ?? []) {
      const node = itemRefs.current.get(recipe.id);

      if (node) {
        nextRects.set(recipe.id, node.getBoundingClientRect());
      }
    }

    for (const [recipeId, nextRect] of nextRects.entries()) {
      const previousRect = previousRects.current.get(recipeId);
      const node = itemRefs.current.get(recipeId);

      if (!node) {
        continue;
      }

      if (!previousRect) {
        node.animate(
          [
            { opacity: 0, transform: 'translateY(12px) scale(0.985)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
          ],
          {
            duration: 280,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both'
          }
        );
        continue;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (deltaX !== 0 || deltaY !== 0) {
        node.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: 'translate(0, 0)' }
          ],
          {
            duration: 360,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both'
          }
        );
      }
    }

    previousRects.current = nextRects;
  }, [recipes]);

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-5 sm:p-6">
            <Skeleton className="shimmer h-5 w-28 rounded-full" />
            <Skeleton className="shimmer mt-5 h-10 w-3/4 rounded-2xl" />
            <Skeleton className="shimmer mt-4 h-4 w-full rounded-full" />
            <Skeleton className="shimmer mt-2 h-4 w-5/6 rounded-full" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="shimmer h-7 w-28 rounded-full" />
              <Skeleton className="shimmer h-7 w-20 rounded-full" />
              <Skeleton className="shimmer h-7 w-24 rounded-full" />
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
          ref={(node) => {
            if (node) {
              itemRefs.current.set(recipe.id, node);
              return;
            }

            itemRefs.current.delete(recipe.id);
            previousRects.current.delete(recipe.id);
          }}
          to={`/recipes/${recipe.id}`}
          className="group block rounded-[30px] transition-transform duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent"
        >
          <Card className="relative flex h-full flex-col justify-between overflow-hidden p-5 transition duration-200 group-hover:-translate-y-1.5 group-hover:border-white/20 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div>
              <div className="min-w-0">
                <p className="app-kicker">Recipe</p>
                  <h3 className="app-heading mt-4 text-[1.45rem] font-semibold leading-[1.04] text-white sm:text-[2rem]">{recipe.title}</h3>
              </div>

              <p className="mt-4 max-h-24 overflow-hidden text-[13px] leading-6 text-[color:var(--text-secondary)] sm:text-sm sm:leading-7">
                {recipe.description || 'No description yet.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{recipe.ingredientsCount ?? recipe.ingredients?.length ?? 0} ingredients</Badge>
                <Badge tone="accent">{recipe.stepsCount ?? recipe.steps?.length ?? 0} steps</Badge>
                <Badge tone="neutral">{formatRecipeTotalTime(recipe)}</Badge>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
              <Clock3 className="h-3.5 w-3.5" />
              Updated {formatDistanceToNow(new Date(recipe.updatedAt), { addSuffix: true })}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
