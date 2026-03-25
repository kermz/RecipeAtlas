import { useMemo, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/page-header';
import { RecipeDialog, type RecipeFormValues } from '../features/recipes/recipe-dialog';
import { RecipeList } from '../features/recipes/recipe-list';
import { useCreateRecipe, useRecipes } from '../features/recipes/hooks';

export function RecipesPage() {
  const navigate = useNavigate();
  const recipesQuery = useRecipes();
  const createRecipe = useCreateRecipe();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sortedRecipes = useMemo(
    () => [...(recipesQuery.data ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [recipesQuery.data]
  );

  const openCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const submitRecipe = async (values: RecipeFormValues) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() ? values.description.trim() : null
    };

    const created = await createRecipe.mutateAsync(payload);
    navigate(`/recipes/${created.id}`);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Recipes"
        title="Manage your recipe collection"
        description="Create recipes, edit details, and drill into each step when you are ready to cook."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => recipesQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New recipe
            </Button>
          </div>
        }
      />

      {recipesQuery.isError && !recipesQuery.data ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          Could not load recipes. Please check the API connection and try again.
        </div>
      ) : null}

      {!recipesQuery.isError || recipesQuery.data ? (
        <RecipeList
          recipes={sortedRecipes}
          isLoading={recipesQuery.isLoading}
          onCreate={openCreateDialog}
        />
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
