# RecipeAtlas Agent Guide

## Purpose

RecipeAtlas is now a Bun repo centered on a single React + Vite + Tailwind app in `web`, backed by Convex functions colocated in `web/convex`.

Primary user flows:

- create, edit, list, and delete recipes
- add, edit, delete, and reorder ingredients
- add, edit, delete, complete, reset, and reorder recipe steps
- start local countdown timers for steps

## Workspace Layout

### Root

- `package.json`: workspace scripts for web + Convex dev and tests
- `dev.sh`: starts Convex dev and Vite together
- `.env.example`: example `VITE_CONVEX_URL`
- `README.md`: setup and local development instructions

### Web (`web`)

- `src/main.tsx`: React entry point with `ConvexProvider`
- `src/router.tsx`: browser routes
- `src/pages/recipes-page.tsx`: recipe list and create flow
- `src/pages/recipe-detail-page.tsx`: recipe detail orchestration for edits, ingredients, steps, resets, and deletes
- `src/features`: UI modules and Convex-backed hooks
- `src/test`: page and hook tests using local mocked feature hooks

### Convex (`web/convex`)

- `schema.ts`: Convex schema for recipes, ingredients, and steps
- `recipes.ts`: public queries and mutations used by the web app
- `ordering.ts`: shared position/reindex helpers
- `validation.ts`: backend input validation and normalization
- `_generated/api.ts`: generated-compatible API surface committed for local type imports

## Architecture Notes

### Backend

The backend is now native Convex:

- `recipes` table stores recipe metadata plus `createdAt` and `updatedAt`
- `recipeIngredients` stores normalized ingredient rows with contiguous `position`
- `recipeSteps` stores normalized step rows with contiguous `position`, `timerStartedAt`, and `completedAt`

Active public functions live in `web/convex/recipes.ts`:

- `listRecipes`
- `getRecipe`
- `createRecipe`
- `updateRecipe`
- `deleteRecipe`
- `createIngredient`
- `updateIngredient`
- `deleteIngredient`
- `resetIngredients`
- `createStep`
- `updateStep`
- `deleteStep`
- `startStepTimer`
- `completeStep`
- `resetStep`
- `resetAllSteps`

Ordering semantics are mutation-local and must keep ingredient and step positions contiguous after inserts, moves, and deletes.

### Frontend

The frontend uses Convex React directly:

- `useQuery` drives reactive reads
- `useMutation` is wrapped in local helpers to preserve simple `mutateAsync` + `isPending` ergonomics
- manual refresh is intentionally gone because Convex reactivity keeps the UI live

Step countdowns remain local browser timers. Convex persists only timestamps for start and completion.

## Runtime and Tooling

### Local commands

- `bun run dev`: run Convex dev and Vite together
- `bun run dev:web`: run only the web app
- `bun run dev:convex`: run only Convex dev
- `bun run test`: run the web + Convex test suite
- `bun run test:web`: run the same test suite from the root

### Environment

Expected variable in `web/.env.local`:

- `VITE_CONVEX_URL`

## Testing Strategy

### Convex tests

Convex tests call the actual query and mutation handlers with an in-memory Convex-style DB double from `web/convex/test-helpers.ts`.

### Web tests

Web page tests no longer use REST or MSW. They mock the feature hook modules with a local in-memory recipe store under `web/src/test/mock-recipe-store.ts`.

## Safe Change Guidance

- If you change ordering semantics, update both `web/convex/ordering.ts` tests and the Convex function tests.
- If you change payload shapes, update `web/src/lib/types.ts`, Convex serializers in `web/convex/recipes.ts`, and the mocked test store together.
- If you change timer behavior, review both `step-timer.tsx` and `use-countdown-timer.ts`.

## Suggested First Files To Read

- `README.md`
- `web/convex/schema.ts`
- `web/convex/recipes.ts`
- `web/src/pages/recipes-page.tsx`
- `web/src/pages/recipe-detail-page.tsx`
- `web/src/features/ingredients/ingredient-list.tsx`
- `web/src/features/recipe-steps/step-list.tsx`

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
