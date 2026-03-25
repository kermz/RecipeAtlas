# RecipeAtlas

Vibe-coded recipe workspace for creating ingredients, drag-and-drop steps, countdown timers, and completion tracking in one place. Built with React, Bun, Fastify, PostgreSQL, and Tailwind so recipes stay easy to manage while cooking without losing your flow.

## Stack

- `apps/web`: React + Vite + Tailwind
- `apps/api`: Bun + Fastify + Prisma
- `db`: PostgreSQL

## Features

- CRUD recipes
- CRUD ingredients with per-ingredient unit conversion
- CRUD ordered recipe steps
- Drag-and-drop ordering for ingredients and steps
- Countdown timers on steps
- Step started and completed timestamps
- Docker Compose support

## Requirements

- Bun
- PostgreSQL
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

3. Create the API env file:

```bash
cp apps/api/.env.example apps/api/.env
```

4. Make sure PostgreSQL is running locally or via Docker, with:

- database: `recipes`
- user: `recipes`
- password: `recipes`
- port: `5432`

5. Generate Prisma client and run migrations:

```bash
cd apps/api
bunx prisma generate
bunx prisma migrate deploy
```

## Run locally

Start frontend and backend together with hot reload:

```bash
bun run dev
```

Or run them separately:

```bash
bun run dev:api
```

```bash
bun run dev:web
```

Local URLs:

- web: `http://localhost:5173`
- api: `http://localhost:3000`
- health: `http://localhost:3000/health`

## Docker

Start everything with Docker Compose:

```bash
docker compose up --build
```

Or with the workspace script:

```bash
bun run docker:up
```

Stop and remove containers and volumes:

```bash
docker compose down -v
```

Or:

```bash
bun run docker:down
```

## Useful commands

Install all dependencies:

```bash
bun install
```

Run API tests:

```bash
bun run test:api
```

Run frontend tests:

```bash
bun run test:web
```

Run Prisma generate:

```bash
cd apps/api
bun run prisma:generate
```

Run Prisma migrations:

```bash
cd apps/api
bun run prisma:migrate
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

Root Docker env example:

```env
POSTGRES_DB=recipes
POSTGRES_USER=recipes
POSTGRES_PASSWORD=recipes
POSTGRES_PORT=5432
DATABASE_URL=postgresql://recipes:recipes@db:5432/recipes?schema=public
PORT=3000
```

Local API env example:

```env
NODE_ENV=development
PORT=3000
HOST=::
DATABASE_URL=postgresql://recipes:recipes@localhost:5432/recipes?schema=public
```

## Notes

- `Reset all steps` also clears started/completed state and resets local countdown timers.
- Ingredient unit conversion is per ingredient row.
- Recipe cards on the main screen open directly when clicked.
