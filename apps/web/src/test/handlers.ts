import { http, HttpResponse } from 'msw';
import type { RecipeDetail, RecipeIngredient, RecipeStep, RecipeSummary } from '../lib/types';

const apiBase = 'http://localhost/api';

const now = () => new Date().toISOString();

type RecipeRecord = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

let recipeSeq = 2;
let ingredientSeq = 2;
let stepSeq = 3;

let recipes: RecipeRecord[] = [];
let ingredients: Record<string, RecipeIngredient[]> = {};
let steps: Record<string, RecipeStep[]> = {};

function resetStore() {
  const timestamp = now();
  recipes = [
    {
      id: 'recipe-1',
      title: 'Sourdough Loaf',
      description: 'A simple loaf with a gentle overnight ferment.',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  ingredients = {
    'recipe-1': [
      {
        id: 'ingredient-1',
        recipeId: 'recipe-1',
        position: 1,
        name: 'Bread flour',
        quantity: 500,
        unit: 'g',
        notes: 'Strong white flour',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ]
  };

  steps = {
    'recipe-1': [
      {
        id: 'step-1',
        recipeId: 'recipe-1',
        position: 1,
        title: 'Mix the dough',
        instructions: 'Combine flour, water, salt, and starter.',
        timerDurationSeconds: 120,
        timerStartedAt: null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: 'step-2',
        recipeId: 'recipe-1',
        position: 2,
        title: 'Rest for 20 minutes',
        instructions: null,
        timerDurationSeconds: 20,
        timerStartedAt: null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ]
  };

  recipeSeq = 2;
  ingredientSeq = 2;
  stepSeq = 3;
}

function toSummary(recipe: RecipeRecord): RecipeSummary {
  return {
    ...recipe,
    ingredientsCount: ingredients[recipe.id]?.length ?? 0,
    ingredients: [...(ingredients[recipe.id] ?? [])].sort((left, right) => left.position - right.position),
    stepsCount: steps[recipe.id]?.length ?? 0
  };
}

function toDetail(recipe: RecipeRecord): RecipeDetail {
  return {
    ...toSummary(recipe),
    ingredients: [...(ingredients[recipe.id] ?? [])].sort((left, right) => left.position - right.position),
    steps: [...(steps[recipe.id] ?? [])].sort((left, right) => left.position - right.position)
  };
}

function getRecipe(recipeId: string) {
  return recipes.find((recipe) => recipe.id === recipeId);
}

function getStep(stepId: string) {
  for (const recipeSteps of Object.values(steps)) {
    const found = recipeSteps.find((step) => step.id === stepId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

resetStore();

export { resetStore };

export const handlers = [
  http.get(`${apiBase}/recipes`, () => HttpResponse.json(recipes.map(toSummary))),

  http.get(`${apiBase}/recipes/:recipeId`, ({ params }) => {
    const recipe = getRecipe(params.recipeId as string);
    if (!recipe) {
      return HttpResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return HttpResponse.json(toDetail(recipe));
  }),

  http.post(`${apiBase}/recipes`, async ({ request }) => {
    const body = (await request.json()) as { title: string; description?: string | null };
    const timestamp = now();
    const recipe: RecipeRecord = {
      id: `recipe-${recipeSeq++}`,
      title: body.title,
      description: body.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    recipes = [recipe, ...recipes];
    ingredients[recipe.id] = [];
    steps[recipe.id] = [];

    return HttpResponse.json(toDetail(recipe), { status: 201 });
  }),

  http.patch(`${apiBase}/recipes/:recipeId`, async ({ params, request }) => {
    const body = (await request.json()) as { title?: string; description?: string | null };
    const recipe = getRecipe(params.recipeId as string);
    if (!recipe) {
      return HttpResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    recipe.title = body.title ?? recipe.title;
    recipe.description = body.description ?? recipe.description;
    recipe.updatedAt = now();

    return HttpResponse.json(toDetail(recipe));
  }),

  http.delete(`${apiBase}/recipes/:recipeId`, ({ params }) => {
    const recipeId = params.recipeId as string;
    recipes = recipes.filter((recipe) => recipe.id !== recipeId);
    delete ingredients[recipeId];
    delete steps[recipeId];
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${apiBase}/recipes/:recipeId/ingredients`, async ({ params, request }) => {
    const recipeId = params.recipeId as string;
    const recipe = getRecipe(recipeId);
    if (!recipe) {
      return HttpResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      name: string;
      quantity: number;
      unit: RecipeIngredient['unit'];
      notes?: string | null;
      position: number;
    };

    const timestamp = now();
    const ingredient: RecipeIngredient = {
      id: `ingredient-${ingredientSeq++}`,
      recipeId,
      position: body.position,
      name: body.name,
      quantity: body.quantity,
      unit: body.unit,
      notes: body.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    ingredients[recipeId] = [...(ingredients[recipeId] ?? []), ingredient];
    recipe.updatedAt = timestamp;
    return HttpResponse.json(ingredient, { status: 201 });
  }),

  http.post(`${apiBase}/recipes/:recipeId/steps`, async ({ params, request }) => {
    const recipeId = params.recipeId as string;
    const recipe = getRecipe(recipeId);
    if (!recipe) {
      return HttpResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      title: string;
      instructions?: string | null;
      position: number;
      timerDurationSeconds?: number | null;
    };

    const timestamp = now();
    const step: RecipeStep = {
      id: `step-${stepSeq++}`,
      recipeId,
      position: body.position,
      title: body.title,
      instructions: body.instructions ?? null,
      timerDurationSeconds: body.timerDurationSeconds ?? null,
      timerStartedAt: null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    steps[recipeId] = [...(steps[recipeId] ?? []), step];
    recipe.updatedAt = timestamp;
    return HttpResponse.json(step, { status: 201 });
  }),

  http.patch(`${apiBase}/steps/:stepId`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<{
      title: string;
      instructions: string | null;
      position: number;
      timerDurationSeconds: number | null;
      timerStartedAt: string | null;
    }>;
    const step = getStep(params.stepId as string);
    if (!step) {
      return HttpResponse.json({ message: 'Step not found' }, { status: 404 });
    }

    step.title = body.title ?? step.title;
    step.instructions = body.instructions ?? step.instructions;
    step.position = body.position ?? step.position;
    step.timerDurationSeconds = body.timerDurationSeconds ?? step.timerDurationSeconds;
    step.updatedAt = now();

    return HttpResponse.json(step);
  }),

  http.patch(`${apiBase}/ingredients/:ingredientId`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<{
      name: string;
      quantity: number;
      unit: RecipeIngredient['unit'];
      notes: string | null;
      position: number;
    }>;

    for (const recipeIngredients of Object.values(ingredients)) {
      const ingredient = recipeIngredients.find((item) => item.id === params.ingredientId);
      if (!ingredient) {
        continue;
      }

      ingredient.name = body.name ?? ingredient.name;
      ingredient.quantity = body.quantity ?? ingredient.quantity;
      ingredient.unit = body.unit ?? ingredient.unit;
      ingredient.notes = body.notes ?? ingredient.notes;
      ingredient.position = body.position ?? ingredient.position;
      ingredient.updatedAt = now();

      return HttpResponse.json(ingredient);
    }

    return HttpResponse.json({ message: 'Ingredient not found' }, { status: 404 });
  }),

  http.post(`${apiBase}/steps/:stepId/start-timer`, ({ params }) => {
    const step = getStep(params.stepId as string);
    if (!step) {
      return HttpResponse.json({ message: 'Step not found' }, { status: 404 });
    }

    step.timerStartedAt = now();
    step.updatedAt = now();
    return HttpResponse.json(step);
  }),

  http.delete(`${apiBase}/steps/:stepId`, ({ params }) => {
    const stepId = params.stepId as string;
    for (const [recipeId, recipeSteps] of Object.entries(steps)) {
      steps[recipeId] = recipeSteps.filter((step) => step.id !== stepId);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${apiBase}/ingredients/:ingredientId`, ({ params }) => {
    const ingredientId = params.ingredientId as string;
    for (const [recipeId, recipeIngredients] of Object.entries(ingredients)) {
      ingredients[recipeId] = recipeIngredients.filter((ingredient) => ingredient.id !== ingredientId);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${apiBase}/steps/:stepId/complete`, ({ params }) => {
    const step = getStep(params.stepId as string);
    if (!step) {
      return HttpResponse.json({ message: 'Step not found' }, { status: 404 });
    }

    step.completedAt = now();
    step.updatedAt = now();
    return HttpResponse.json(step);
  }),

  http.post(`${apiBase}/steps/:stepId/reset`, ({ params }) => {
    const step = getStep(params.stepId as string);
    if (!step) {
      return HttpResponse.json({ message: 'Step not found' }, { status: 404 });
    }

    step.completedAt = null;
    step.timerStartedAt = null;
    step.updatedAt = now();
    return HttpResponse.json(step);
  })
];
