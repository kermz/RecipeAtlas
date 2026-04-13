import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { useAuthSession } from '../features/auth/hooks';
import { RecipeDialog, type RecipeFormValues } from '../features/recipes/recipe-dialog';
import { RecipeList } from '../features/recipes/recipe-list';
import { useCreateRecipe, useRecipes } from '../features/recipes/hooks';

export function RecipesPage() {
  const navigate = useNavigate();
  const recipesQuery = useRecipes();
  const createRecipe = useCreateRecipe();
  const { isAuthenticated } = useAuthSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 220);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const sortedRecipes = useMemo(
    () => [...(recipesQuery.data ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [recipesQuery.data]
  );
  const filteredRecipes = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedRecipes;
    }

    return sortedRecipes.filter((recipe) => {
      const titleMatch = recipe.title.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = recipe.description?.toLowerCase().includes(normalizedQuery);

      return titleMatch || descriptionMatch;
    });
  }, [debouncedSearchQuery, sortedRecipes]);

  const openCreateDialog = () => {
    if (!isAuthenticated) {
      return;
    }

    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const submitRecipe = async (values: RecipeFormValues) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() ? values.description.trim() : null,
      visibility: values.visibility
    };

    const created = await createRecipe.mutateAsync(payload);
    navigate(`/recipes/${created.id}`);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Recipes"
        title={isAuthenticated ? 'Manage your recipe collection' : 'Browse shared recipes'}
        description={
          isAuthenticated
            ? 'Keep private drafts, invite collaborators, and move from quick ingredient edits to timer-backed step walkthroughs together.'
            : 'Browse public recipes now, then sign in from the header when you want your own private collection and collaborative editing tools.'
        }
        action={
          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Button onClick={openCreateDialog} disabled={!isAuthenticated}>
              <Plus className="h-4 w-4" />
              {isAuthenticated ? 'New recipe' : 'Sign in to create'}
            </Button>
          </div>
        }
      />

      {recipesQuery.isError && !recipesQuery.data ? (
        <div className="rounded-[24px] border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          Could not load recipes. Please check the API connection and try again.
        </div>
      ) : null}

      {!recipesQuery.isError || recipesQuery.data ? (
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
              Public recipes stay visible while signed out. Sign in from the header to create private recipes, invite editors, and save recipe-specific timers in this browser.
            </div>
          ) : null}
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 sm:p-5">
            <label className="block">
              <span className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                <Search className="h-3.5 w-3.5" />
                Search
              </span>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search recipes by title or description"
                aria-label="Search recipes"
              />
            </label>
          </div>

          {!recipesQuery.isLoading && sortedRecipes.length > 0 && filteredRecipes.length === 0 ? (
            <EmptyState
              title="No matching recipes"
              description="Try a different search term or clear the filter to see your full collection."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setDebouncedSearchQuery('');
                  }}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <RecipeList
              recipes={filteredRecipes}
              isLoading={recipesQuery.isLoading}
              onCreate={isAuthenticated ? openCreateDialog : undefined}
            />
          )}
        </div>
      ) : null}

      <RecipeDialog
        open={isDialogOpen}
        recipe={null}
        onClose={closeDialog}
        onSubmit={submitRecipe}
      />
    </section>
  );
}
