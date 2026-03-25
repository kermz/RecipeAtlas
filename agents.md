# RecipeAtlas Agent Guide

## Purpose

RecipeAtlas is a Bun monorepo for a recipe-management app with:

- a Fastify + Prisma API in `apps/api`
- a React + Vite + Tailwind web app in `apps/web`
- PostgreSQL for persistence

The main user flows are:

- create, edit, list, and delete recipes
- add, edit, delete, and reorder ingredients
- add, edit, delete, complete, reset, and reorder recipe steps
- start local countdown timers for steps

## Workspace Layout

### Root

- `package.json`: workspace scripts for dev, tests, and Docker
- `docker-compose.yml`: local multi-container setup for `db`, `api`, and `web`
- `dev.sh`: starts API and web together for local development
- `.env.example`: Docker-oriented environment example
- `README.md`: user-facing setup instructions

### API (`apps/api`)

- `src/app.ts`: Fastify app creation, CORS, health endpoint, route registration, error handling
- `src/server.ts`: boots the API using validated env vars
- `src/routes/recipes.ts`: recipe CRUD plus nested create endpoints for steps and ingredients
- `src/routes/steps.ts`: step update, delete, complete, reset, and timer-start endpoints
- `src/routes/ingredients.ts`: ingredient update and delete endpoints
- `src/schemas/recipes.ts`: Zod request validation for recipes, steps, and ingredients
- `src/utils/step-order.ts`: shared position clamping helper
- `prisma/schema.prisma`: database schema for recipes, steps, and ingredients
- `test/*.test.ts`: route-level API tests using a Prisma test double

### Web (`apps/web`)

- `src/main.tsx`: React entry point with React Query provider
- `src/router.tsx`: app routes
- `src/components`: shared layout and UI building blocks
- `src/pages/recipes-page.tsx`: recipe listing and recipe creation flow
- `src/pages/recipe-detail-page.tsx`: recipe detail orchestration for editing, ingredients, steps, resets, and deletes
- `src/features/recipes`: API functions, React Query hooks, recipe dialog, recipe list
- `src/features/ingredients`: ingredient API/hooks, dialog, sortable list, unit conversion helpers
- `src/features/recipe-steps`: step API/hooks, dialog, sortable list, countdown timer logic, time formatting
- `src/test`: MSW-backed frontend test setup

## Architecture Notes

### Backend

The active backend architecture is route-centric. Route handlers talk directly to Prisma, and ordering logic is handled inside Prisma transactions so ingredient and step positions stay contiguous after inserts, moves, and deletes.

Current API shape:

- `GET /health`
- `GET /recipes`
- `POST /recipes`
- `GET /recipes/:id`
- `PATCH /recipes/:id`
- `DELETE /recipes/:id`
- `POST /recipes/:recipeId/steps`
- `POST /recipes/:recipeId/ingredients`
- `PATCH /steps/:id`
- `DELETE /steps/:id`
- `POST /steps/:id/complete`
- `POST /steps/:id/start-timer`
- `POST /steps/:id/reset`
- `PATCH /ingredients/:id`
- `DELETE /ingredients/:id`

Data model:

- `Recipe`: title, optional description, timestamps
- `RecipeStep`: ordered by `position`, optional instructions, optional timer duration, optional `timerStartedAt`, optional `completedAt`
- `RecipeIngredient`: ordered by `position`, quantity, unit, optional notes

Validation rules are enforced with Zod before Prisma is called.

### Frontend

The frontend is feature-oriented and uses React Query for server state.

- page components orchestrate dialogs and user flows
- feature `api.ts` files define HTTP calls
- feature `hooks.ts` files wrap those calls with React Query
- drag-and-drop reordering uses `@dnd-kit`
- step countdown timers are local UI state, while `timerStartedAt` and `completedAt` are persisted via the API

The detail page is the highest-leverage file when changing recipe behavior because it coordinates nearly all step and ingredient mutations.

## Runtime and Tooling

### Local commands

- `bun run dev`: run web and API together
- `bun run dev:api`: run only the API
- `bun run dev:web`: run only the web app
- `bun run test:api`: run API tests
- `bun run test:web`: run web tests
- `bun run docker:up`: run the full stack in Docker

### API environment

Expected variables in `apps/api/.env`:

- `DATABASE_URL`
- `PORT`
- `HOST`

### Web networking

In local development, Vite proxies `/api` to `http://127.0.0.1:3000`.

In Docker, nginx proxies `/api/` to the `api` service.

## Testing Strategy

### API tests

API tests build the real Fastify app and pass in a Prisma-shaped in-memory double from `apps/api/test/helpers.ts`. That means route behavior, validation, and ordering logic are covered without needing a live database.

### Web tests

Web tests use:

- `vitest`
- `@testing-library/react`
- `msw`

The frontend test store in `src/test/handlers.ts` mimics API behavior for recipe, ingredient, and step flows.

## Important Review Notes

- The current API no longer uses the older repository/service abstraction under `apps/api/src/lib` (`recipe-service.ts`, `in-memory-repository.ts`, `prisma-repository.ts`, and related types/errors). Those files look like an earlier architecture and are currently dead code.
- Route tests are the main source of backend truth right now, not the unused service layer.
- The frontend sorts recipe cards by `updatedAt` client-side even though the API returns recipes ordered by `createdAt desc`.
- Step countdowns are intentionally local browser timers. The API stores when a timer started, but not the remaining duration. UI pause/resume is local-only.

## Safe Change Guidance

- If you change ordering semantics, update both the API transactions and the route tests.
- If you change API payloads, update `apps/web/src/lib/types.ts`, the feature `api.ts` modules, and MSW handlers together.
- If you change timer behavior, review both `step-timer.tsx` and `use-countdown-timer.ts`.
- If you remove the unused backend service/repository files, do it as a focused cleanup so it stays easy to review.

## Suggested First Files To Read

- `README.md`
- `apps/api/src/app.ts`
- `apps/api/src/routes/recipes.ts`
- `apps/api/src/routes/steps.ts`
- `apps/api/prisma/schema.prisma`
- `apps/web/src/pages/recipes-page.tsx`
- `apps/web/src/pages/recipe-detail-page.tsx`
- `apps/web/src/features/ingredients/ingredient-list.tsx`
- `apps/web/src/features/recipe-steps/step-list.tsx`
