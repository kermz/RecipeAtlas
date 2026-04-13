import { afterEach, beforeEach, describe, expect, it, setSystemTime } from "bun:test";
import { convexTest } from "convex-test";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = {
  "./_generated/api.js": () => import("./_generated/api.js"),
  "./_generated/server.js": () => import("./_generated/server.js"),
  "./ordering.ts": () => import("./ordering"),
  "./recipes.ts": () => import("./recipes"),
  "./schema.ts": () => import("./schema"),
  "./validation.ts": () => import("./validation")
};

function createIdentity(tokenIdentifier: string, email: string, emailVerified = true) {
  return {
    tokenIdentifier,
    email,
    emailVerified,
    name: "Recipe Tester"
  };
}

describe("recipe convex functions", () => {
  beforeEach(() => {
    setSystemTime(new Date("2026-04-09T12:00:00.000Z"));
  });

  afterEach(() => {
    setSystemTime();
  });

  it("creates, updates, lists, and deletes recipes", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(createIdentity("token-1", "chef@example.com"));

    const firstRecipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Pasta Night",
      description: "Fresh basil",
      visibility: "private"
    });

    setSystemTime(new Date("2026-04-09T12:05:00.000Z"));
    const secondRecipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Soup Day",
      description: null,
      visibility: "public"
    });

    setSystemTime(new Date("2026-04-09T12:10:00.000Z"));
    await owner.mutation(api.recipes.updateRecipe, {
      recipeId: firstRecipe.id,
      title: "Pasta Night Deluxe",
      visibility: "public"
    });

    const recipes = await owner.query(api.recipes.listRecipes, {});
    expect(recipes.map((recipe) => recipe.title)).toEqual(["Pasta Night Deluxe", "Soup Day"]);
    expect(recipes.find((recipe) => recipe.id === firstRecipe.id)?.visibility).toBe("public");
    expect(recipes.find((recipe) => recipe.id === firstRecipe.id)?.isOwner).toBe(true);

    const anonymousRecipes = await t.query(api.recipes.listRecipes, {});
    expect(anonymousRecipes.map((recipe) => recipe.title)).toEqual(["Pasta Night Deluxe", "Soup Day"]);

    await owner.mutation(api.recipes.deleteRecipe, {
      recipeId: secondRecipe.id
    });

    const afterDelete = await owner.query(api.recipes.listRecipes, {});
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].title).toBe("Pasta Night Deluxe");
  });

  it("keeps ingredient ordering contiguous and can reset purchased flags", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(createIdentity("token-1", "chef@example.com"));

    const recipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Bread",
      description: null
    });

    const flour = await owner.mutation(api.recipes.createIngredient, {
      recipeId: recipe.id,
      name: "Flour",
      quantity: 500,
      unit: "g",
      position: 1
    });

    await owner.mutation(api.recipes.createIngredient, {
      recipeId: recipe.id,
      name: "Water",
      quantity: 320,
      unit: "ml",
      position: 2
    });

    const salt = await owner.mutation(api.recipes.createIngredient, {
      recipeId: recipe.id,
      name: "Salt",
      quantity: 10,
      unit: "g",
      position: 2
    });

    let detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.ingredients.map((ingredient) => `${ingredient.name}:${ingredient.position}`)).toEqual([
      "Flour:1",
      "Salt:2",
      "Water:3"
    ]);

    await owner.mutation(api.recipes.updateIngredient, {
      ingredientId: salt.id,
      position: 1,
      purchased: true
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.ingredients.map((ingredient) => `${ingredient.name}:${ingredient.position}`)).toEqual([
      "Salt:1",
      "Flour:2",
      "Water:3"
    ]);
    expect(detail?.ingredients.find((ingredient) => ingredient.id === salt.id)?.purchased).toBe(true);

    await owner.mutation(api.recipes.resetIngredients, {
      recipeId: recipe.id
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.ingredients.every((ingredient) => ingredient.purchased === false)).toBe(true);

    await owner.mutation(api.recipes.deleteIngredient, {
      ingredientId: flour.id
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.ingredients.map((ingredient) => ingredient.position)).toEqual([1, 2]);
  });

  it("supports step lifecycle mutations and reset-all in a single mutation", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(createIdentity("token-1", "chef@example.com"));

    const recipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Cake",
      description: null
    });

    const mix = await owner.mutation(api.recipes.createStep, {
      recipeId: recipe.id,
      title: "Mix",
      position: 1,
      timerDurationSeconds: 120
    });

    const bake = await owner.mutation(api.recipes.createStep, {
      recipeId: recipe.id,
      title: "Bake",
      position: 2,
      timerDurationSeconds: 1800
    });

    await owner.mutation(api.recipes.createStep, {
      recipeId: recipe.id,
      title: "Rest",
      position: 2,
      timerDurationSeconds: null
    });

    let detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.steps.map((step) => `${step.title}:${step.position}`)).toEqual(["Mix:1", "Rest:2", "Bake:3"]);

    await owner.mutation(api.recipes.updateStep, {
      stepId: bake.id,
      position: 1
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.steps.map((step) => `${step.title}:${step.position}`)).toEqual(["Bake:1", "Mix:2", "Rest:3"]);

    const started = await owner.mutation(api.recipes.startStepTimer, {
      stepId: mix.id
    });
    expect(started.timerStartedAt).toMatch(/^2026-04-09T12:00:00/);

    const completed = await owner.mutation(api.recipes.completeStep, {
      stepId: mix.id
    });
    expect(completed.completedAt).toMatch(/^2026-04-09T12:00:00/);

    const reset = await owner.mutation(api.recipes.resetStep, {
      stepId: mix.id
    });
    expect(reset.timerStartedAt).toBeNull();
    expect(reset.completedAt).toBeNull();

    await owner.mutation(api.recipes.startStepTimer, {
      stepId: mix.id
    });
    await owner.mutation(api.recipes.completeStep, {
      stepId: bake.id
    });
    await owner.mutation(api.recipes.resetAllSteps, {
      recipeId: recipe.id
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.steps.every((step) => step.completedAt === null && step.timerStartedAt === null)).toBe(true);

    await owner.mutation(api.recipes.deleteStep, {
      stepId: mix.id
    });

    detail = await owner.query(api.recipes.getRecipe, { recipeId: recipe.id });
    expect(detail?.steps.map((step) => step.position)).toEqual([1, 2]);
  });

  it("hides private recipes from other users while keeping public ones visible", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(createIdentity("token-1", "chef@example.com"));
    const collaborator = t.withIdentity(createIdentity("token-2", "friend@example.com"));
    const viewer = t.withIdentity(createIdentity("token-3", "viewer@example.com"));

    const privateRecipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Private Bread",
      description: null,
      visibility: "private"
    });

    const publicRecipe = await owner.mutation(api.recipes.createRecipe, {
      title: "Public Soup",
      description: null,
      visibility: "public"
    });

    const collaboratorLink = await owner.mutation(api.recipes.addRecipeCollaborator, {
      recipeId: privateRecipe.id,
      email: "friend@example.com"
    });

    expect(await viewer.query(api.recipes.getRecipe, { recipeId: privateRecipe.id })).toBeNull();
    expect(await viewer.query(api.recipes.getRecipe, { recipeId: publicRecipe.id })).toMatchObject({
      id: publicRecipe.id,
      isOwner: false,
      isCollaborator: false,
      canEdit: false,
      visibility: "public"
    });

    expect(await collaborator.query(api.recipes.getRecipe, { recipeId: privateRecipe.id })).toMatchObject({
      id: privateRecipe.id,
      isOwner: false,
      isCollaborator: true,
      canEdit: true,
      collaboratorCount: 1
    });

    await collaborator.mutation(api.recipes.createIngredient, {
      recipeId: privateRecipe.id,
      name: "Salt",
      quantity: 10,
      unit: "g",
      position: 1
    });

    const step = await collaborator.mutation(api.recipes.createStep, {
      recipeId: privateRecipe.id,
      title: "Mix",
      position: 1,
      timerDurationSeconds: null
    });

    const completed = await collaborator.mutation(api.recipes.completeStep, {
      stepId: step.id
    });
    expect(completed.completedAt).toMatch(/^2026-04-09T12:00:00/);

    const collaboratorRecipes = await collaborator.query(api.recipes.listRecipes, {});
    expect(collaboratorRecipes.map((recipe) => recipe.id)).toContain(privateRecipe.id);

    await expect(
      collaborator.mutation(api.recipes.deleteRecipe, {
        recipeId: privateRecipe.id
      })
    ).rejects.toThrow("You do not have access to this recipe");

    await owner.mutation(api.recipes.removeRecipeCollaborator, {
      recipeId: privateRecipe.id,
      collaboratorId: collaboratorLink.id
    });

    expect(await collaborator.query(api.recipes.getRecipe, { recipeId: privateRecipe.id })).toBeNull();
  });
});
