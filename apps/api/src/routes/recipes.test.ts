import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app";

const createPrismaMock = () =>
  ({
    recipe: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    recipeStep: {
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(createPrismaMock()))
  }) as never;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("recipes routes", () => {
  it("lists recipes with steps", async () => {
    const prisma = createPrismaMock();
    prisma.recipe.findMany.mockResolvedValue([
      { id: "recipe-1", title: "Soup", description: null, steps: [] }
    ]);

    const app = createApp(prisma);
    const response = await app.inject({ method: "GET", url: "/recipes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "recipe-1", title: "Soup", description: null, steps: [] }]);
  });

  it("creates a recipe", async () => {
    const prisma = createPrismaMock();
    prisma.recipe.create.mockResolvedValue({
      id: "recipe-1",
      title: "Cake",
      description: "Chocolate",
      steps: []
    });

    const app = createApp(prisma);
    const response = await app.inject({
      method: "POST",
      url: "/recipes",
      payload: {
        title: "Cake",
        description: "Chocolate"
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ title: "Cake" });
  });

  it("marks a step complete", async () => {
    const prisma = createPrismaMock();
    prisma.recipeStep.update.mockResolvedValue({
      id: "step-1",
      title: "Bake",
      completedAt: "2026-03-25T10:00:00.000Z"
    });

    const app = createApp(prisma);
    const response = await app.inject({
      method: "POST",
      url: "/steps/step-1/complete"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: "step-1" });
  });
});
