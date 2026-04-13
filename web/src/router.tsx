import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { NotFoundPage } from './pages/not-found-page';
import { RecipeDetailPage } from './pages/recipe-detail-page';
import { RecipesPage } from './pages/recipes-page';

export function createAppRouter(): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter([
    {
      element: <AppShell />,
      children: [
        { path: '/', element: <Navigate to="/recipes" replace /> },
        { path: '/recipes', element: <RecipesPage /> },
        { path: '/recipes/:recipeId', element: <RecipeDetailPage /> },
        { path: '*', element: <NotFoundPage /> }
      ]
    }
  ]);
}
