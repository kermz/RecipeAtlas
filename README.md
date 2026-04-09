# RecipeAtlas

Vibe-coded recipe workspace for creating ingredients, drag-and-drop steps, countdown timers, and completion tracking in one place. Built with React, Bun, Convex, and Tailwind so recipes stay easy to manage while cooking without losing your flow.

## Stack

- `apps/web`: React + Vite + Tailwind + Convex

## Features

- CRUD recipes
- email/password login with Convex + Better Auth
- private recipes scoped to the signed-in user, with invited editor access
- public recipe sharing with read-only access for other viewers
- multi-user recipe collaboration for ingredients, steps, timers, and completion progress
- CRUD ingredients with per-ingredient unit conversion
- CRUD ordered recipe steps
- Drag-and-drop ordering for ingredients and steps
- Recipe-specific countdown timers on steps
- Step started and completed timestamps

## Requirements

- Bun
- Convex account and deployment URL
- Git Bash recommended for local dev on Windows

## Local setup

1. Clone the repository and move into the project root:

```bash
git clone <your-repo-url>
cd RecipeAtlas
```

2. Install dependencies:

```bash
bun install
```

3. Create a local web env file:

```bash
cp .env.example apps/web/.env.local
```

4. Set `VITE_CONVEX_URL` in `apps/web/.env.local` to your Convex deployment URL.
   If you want to set it explicitly, also add `VITE_CONVEX_SITE_URL` with the matching `.site` URL.

5. Start Convex dev once to configure or attach the project:

```bash
cd apps/web
bunx convex dev
```

6. Configure Better Auth for your Convex deployment:

```bash
cd apps/web
npx convex env set BETTER_AUTH_SECRET <generate-a-random-secret>
npx convex env set SITE_URL http://localhost:5173
```

## Run locally

Start Vite and Convex dev together with hot reload:

```bash
bun run dev
```

Or run them separately from the root:

```bash
bun run dev:web
```

```bash
bun run dev:convex
```

Local URLs:

- web: `http://localhost:5173`
- Convex dashboard/deployment: provided by Convex during setup

## Useful commands

Install all dependencies:

```bash
bun install
```

Run all tests:

```bash
bun run test
```

Run frontend tests:

```bash
bun run test:web
```

Run frontend build:

```bash
cd apps/web
bun run build
```

Run frontend preview:

```bash
cd apps/web
bun run preview
```

## Environment

Root env example:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## Notes

- `Reset all steps` also clears started/completed state and resets local countdown timers.
- Recipe timers persist per recipe in local browser storage, so navigating away and back keeps the active countdown for that recipe.
- Ingredient unit conversion is per ingredient row.
- Signed-in users see their own private and public recipes. Signed-out users only see public recipes.
