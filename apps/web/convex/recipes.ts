import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { clampPosition, removeRecord, reorderRecords } from "./ordering";
import {
  validateIngredientInput,
  validateIngredientPatch,
  validateRecipeInput,
  validateRecipePatch,
  validateStepInput,
  validateStepPatch
} from "./validation";

type RecipeDoc = Doc<"recipes">;
type CollaboratorDoc = Doc<"recipeCollaborators">;
type IngredientDoc = Doc<"recipeIngredients">;
type StepDoc = Doc<"recipeSteps">;
type DbReader = QueryCtx["db"] | MutationCtx["db"];
type IdentityLike = {
  tokenIdentifier: string;
  name?: string | null;
  email?: string | null;
  emailNormalized: string | null;
  emailVerified: boolean;
} | null;
type RecipeAccess = {
  viewerTokenIdentifier: string | null;
  viewerEmailNormalized: string | null;
  isOwner: boolean;
  isCollaborator: boolean;
  canView: boolean;
  canEdit: boolean;
};

function toIso(timestamp: number | null | undefined) {
  return timestamp == null ? null : new Date(timestamp).toISOString();
}

function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function isRecipeOwner(recipe: RecipeDoc, viewerTokenIdentifier: string | null) {
  return recipe.ownerTokenIdentifier === viewerTokenIdentifier;
}

function serializeCollaborator(collaborator: CollaboratorDoc, viewerEmailNormalized: string | null) {
  return {
    id: collaborator._id,
    recipeId: collaborator.recipeId,
    email: collaborator.collaboratorEmail,
    isCurrentUser: collaborator.collaboratorEmail === viewerEmailNormalized,
    createdAt: new Date(collaborator.createdAt).toISOString()
  };
}

function serializeIngredient(ingredient: IngredientDoc) {
  return {
    id: ingredient._id,
    recipeId: ingredient.recipeId,
    position: ingredient.position,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    notes: ingredient.notes ?? null,
    purchased: ingredient.purchased,
    createdAt: new Date(ingredient.createdAt).toISOString(),
    updatedAt: new Date(ingredient.updatedAt).toISOString()
  };
}

function serializeStep(step: StepDoc) {
  return {
    id: step._id,
    recipeId: step.recipeId,
    position: step.position,
    title: step.title,
    instructions: step.instructions ?? null,
    timerDurationSeconds: step.timerDurationSeconds ?? null,
    timerStartedAt: toIso(step.timerStartedAt),
    completedAt: toIso(step.completedAt),
    createdAt: new Date(step.createdAt).toISOString(),
    updatedAt: new Date(step.updatedAt).toISOString()
  };
}

async function loadIngredients(db: DbReader, recipeId: Id<"recipes">) {
  return db
    .query("recipeIngredients")
    .withIndex("by_recipe_position", (q) => q.eq("recipeId", recipeId))
    .take(500);
}

async function loadSteps(db: DbReader, recipeId: Id<"recipes">) {
  return db
    .query("recipeSteps")
    .withIndex("by_recipe_position", (q) => q.eq("recipeId", recipeId))
    .take(500);
}

async function loadCollaborators(db: DbReader, recipeId: Id<"recipes">) {
  return db
    .query("recipeCollaborators")
    .withIndex("by_recipeId_and_collaboratorEmail", (q) => q.eq("recipeId", recipeId))
    .take(100);
}

async function findCollaboratorByEmail(
  db: DbReader,
  recipeId: Id<"recipes">,
  collaboratorEmail: string | null
) {
  if (!collaboratorEmail) {
    return null;
  }

  const [collaborator] = await db
    .query("recipeCollaborators")
    .withIndex("by_recipeId_and_collaboratorEmail", (q) =>
      q.eq("recipeId", recipeId).eq("collaboratorEmail", collaboratorEmail)
    )
    .take(1);

  return collaborator ?? null;
}

async function touchRecipe(db: MutationCtx["db"], recipeId: Id<"recipes">, now: number) {
  await db.patch(recipeId, { updatedAt: now });
}

async function getIdentity(ctx: Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">): Promise<IdentityLike> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return {
    tokenIdentifier: identity.tokenIdentifier,
    name: identity.name ?? null,
    email: identity.email ?? null,
    emailNormalized: normalizeEmail(identity.email),
    emailVerified: identity.emailVerified === true
  };
}

function getOwnerName(identity: NonNullable<IdentityLike>) {
  return identity.name?.trim() || identity.email?.trim() || "Anonymous cook";
}

async function getRecipeAccess(db: DbReader, recipe: RecipeDoc, identity: IdentityLike): Promise<RecipeAccess> {
  const viewerTokenIdentifier = identity?.tokenIdentifier ?? null;
  const viewerEmailNormalized = identity?.emailVerified ? identity.emailNormalized : null;
  const isOwner = isRecipeOwner(recipe, viewerTokenIdentifier);
  const collaborator = isOwner
    ? null
    : await findCollaboratorByEmail(db, recipe._id, viewerEmailNormalized);
  const isCollaborator = Boolean(collaborator);

  return {
    viewerTokenIdentifier,
    viewerEmailNormalized,
    isOwner,
    isCollaborator,
    canView: recipe.visibility === "public" || isOwner || isCollaborator,
    canEdit: isOwner || isCollaborator
  };
}

async function requireIdentity(ctx: Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">) {
  const identity = await getIdentity(ctx);

  if (!identity) {
    throw new Error("You must be signed in to do that");
  }

  return identity;
}

async function requireOwnedRecipe(ctx: MutationCtx, recipeId: Id<"recipes">) {
  const [identity, recipe] = await Promise.all([requireIdentity(ctx), ctx.db.get(recipeId)]);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  if (recipe.ownerTokenIdentifier !== identity.tokenIdentifier) {
    throw new Error("You do not have access to this recipe");
  }

  return { identity, recipe };
}

async function requireEditableRecipe(ctx: MutationCtx, recipeId: Id<"recipes">) {
  const [identity, recipe] = await Promise.all([requireIdentity(ctx), ctx.db.get(recipeId)]);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const access = await getRecipeAccess(ctx.db, recipe, identity);

  if (!access.canEdit) {
    throw new Error("You do not have access to this recipe");
  }

  return { identity, recipe, access };
}

async function serializeRecipeDetail(db: DbReader, recipe: RecipeDoc, access: RecipeAccess) {
  const [ingredients, steps, collaborators] = await Promise.all([
    loadIngredients(db, recipe._id),
    loadSteps(db, recipe._id),
    loadCollaborators(db, recipe._id)
  ]);

  return {
    id: recipe._id,
    title: recipe.title,
    description: recipe.description ?? null,
    ownerName: recipe.ownerName,
    visibility: recipe.visibility,
    isOwner: access.isOwner,
    isCollaborator: access.isCollaborator,
    canEdit: access.canEdit,
    createdAt: new Date(recipe.createdAt).toISOString(),
    updatedAt: new Date(recipe.updatedAt).toISOString(),
    collaboratorCount: collaborators.length,
    collaborators: collaborators
      .sort((left, right) => left.collaboratorEmail.localeCompare(right.collaboratorEmail))
      .map((collaborator) => serializeCollaborator(collaborator, access.viewerEmailNormalized)),
    ingredientsCount: ingredients.length,
    stepsCount: steps.length,
    ingredients: ingredients.map(serializeIngredient),
    steps: steps.map(serializeStep)
  };
}

export const listRecipes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    const viewerTokenIdentifier = identity?.tokenIdentifier ?? null;
    const viewerEmailNormalized = identity?.emailVerified ? identity.emailNormalized : null;
    const publicRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_visibility_and_updatedAt", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(50);
    const ownRecipes = viewerTokenIdentifier
      ? await ctx.db
          .query("recipes")
          .withIndex("by_ownerTokenIdentifier_and_updatedAt", (q) => q.eq("ownerTokenIdentifier", viewerTokenIdentifier))
          .order("desc")
          .take(50)
      : [];
    const collaboratorLinks = viewerEmailNormalized
      ? await ctx.db
          .query("recipeCollaborators")
          .withIndex("by_collaboratorEmail_and_createdAt", (q) => q.eq("collaboratorEmail", viewerEmailNormalized))
          .order("desc")
          .take(50)
      : [];
    const collaboratedRecipes = (
      await Promise.all(collaboratorLinks.map((collaborator) => ctx.db.get(collaborator.recipeId)))
    ).filter((recipe): recipe is RecipeDoc => recipe !== null);
    const accessibleRecipes = [...ownRecipes, ...publicRecipes]
      .concat(collaboratedRecipes)
      .reduce<Map<Id<"recipes">, RecipeDoc>>((recipes, recipe) => {
        recipes.set(recipe._id, recipe);
        return recipes;
      }, new Map())
      .values();

    const recipes = await Promise.all(
      [...accessibleRecipes]
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map(async (recipe) => {
          const access = await getRecipeAccess(ctx.db, recipe, identity);
          return access.canView ? serializeRecipeDetail(ctx.db, recipe, access) : null;
        })
    );

    return recipes.filter((recipe) => recipe !== null);
  }
});

export const getRecipe = query({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    const [identity, recipe] = await Promise.all([getIdentity(ctx), ctx.db.get(recipeId)]);

    if (!recipe) {
      return null;
    }

    const access = await getRecipeAccess(ctx.db, recipe, identity);

    if (!access.canView) {
      return null;
    }

    return serializeRecipeDetail(ctx.db, recipe, access);
  }
});

export const createRecipe = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public")))
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const recipe = validateRecipeInput(args);
    const now = Date.now();
    const recipeId = await ctx.db.insert("recipes", {
      ...recipe,
      ownerName: getOwnerName(identity),
      ownerTokenIdentifier: identity.tokenIdentifier,
      createdAt: now,
      updatedAt: now
    });
    const created = await ctx.db.get(recipeId);

    if (!created) {
      throw new Error("Recipe could not be created");
    }

    return serializeRecipeDetail(ctx.db, created, {
      viewerTokenIdentifier: identity.tokenIdentifier,
      viewerEmailNormalized: identity.emailNormalized,
      isOwner: true,
      isCollaborator: false,
      canView: true,
      canEdit: true
    });
  }
});

export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public")))
  },
  handler: async (ctx, { recipeId, ...patch }) => {
    const { identity } = await requireOwnedRecipe(ctx, recipeId);
    const next = validateRecipePatch(patch);
    const now = Date.now();

    await ctx.db.patch(recipeId, {
      ...(next.title === undefined ? {} : { title: next.title }),
      ...(next.description === undefined ? {} : { description: next.description }),
      ...(next.visibility === undefined ? {} : { visibility: next.visibility }),
      updatedAt: now
    });

    const updated = await ctx.db.get(recipeId);

    if (!updated) {
      throw new Error("Recipe not found");
    }

    return serializeRecipeDetail(ctx.db, updated, {
      viewerTokenIdentifier: identity.tokenIdentifier,
      viewerEmailNormalized: identity.emailNormalized,
      isOwner: true,
      isCollaborator: false,
      canView: true,
      canEdit: true
    });
  }
});

export const deleteRecipe = mutation({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    await requireOwnedRecipe(ctx, recipeId);

    const [ingredients, steps, collaborators] = await Promise.all([
      loadIngredients(ctx.db, recipeId),
      loadSteps(ctx.db, recipeId),
      loadCollaborators(ctx.db, recipeId)
    ]);

    for (const ingredient of ingredients) {
      await ctx.db.delete(ingredient._id);
    }

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    for (const collaborator of collaborators) {
      await ctx.db.delete(collaborator._id);
    }

    await ctx.db.delete(recipeId);
    return null;
  }
});

export const createIngredient = mutation({
  args: {
    recipeId: v.id("recipes"),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.union(v.string(), v.null())),
    purchased: v.optional(v.boolean()),
    position: v.optional(v.number())
  },
  handler: async (ctx, { recipeId, ...input }) => {
    await requireEditableRecipe(ctx, recipeId);

    const ingredient = validateIngredientInput(input);
    const now = Date.now();
    const currentIngredients = await loadIngredients(ctx.db, recipeId);
    const nextPosition = clampPosition(ingredient.position, 1, currentIngredients.length + 1);

    for (const existingIngredient of currentIngredients) {
      if (existingIngredient.position >= nextPosition) {
        await ctx.db.patch(existingIngredient._id, {
          position: existingIngredient.position + 1,
          updatedAt: now
        });
      }
    }

    const ingredientId = await ctx.db.insert("recipeIngredients", {
      recipeId,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes,
      purchased: ingredient.purchased,
      position: nextPosition,
      createdAt: now,
      updatedAt: now
    });

    await touchRecipe(ctx.db, recipeId, now);

    const created = await ctx.db.get(ingredientId);

    if (!created) {
      throw new Error("Ingredient could not be created");
    }

    return serializeIngredient(created);
  }
});

export const updateIngredient = mutation({
  args: {
    ingredientId: v.id("recipeIngredients"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    notes: v.optional(v.union(v.string(), v.null())),
    purchased: v.optional(v.boolean()),
    position: v.optional(v.number())
  },
  handler: async (ctx, { ingredientId, ...input }) => {
    const ingredient = await ctx.db.get(ingredientId);

    if (!ingredient) {
      throw new Error("Ingredient not found");
    }

    await requireEditableRecipe(ctx, ingredient.recipeId);

    const patch = validateIngredientPatch(input);
    const now = Date.now();
    const ingredients = await loadIngredients(ctx.db, ingredient.recipeId);
    const nextPositions = reorderRecords(
      ingredients.map((currentIngredient) => ({
        id: currentIngredient._id,
        position: currentIngredient.position
      })),
      ingredientId,
      patch.position ?? ingredient.position
    );

    for (const next of nextPositions) {
      const currentIngredient = ingredients.find((record) => record._id === next.id);

      if (!currentIngredient) {
        continue;
      }

      const nextPatch: Record<string, unknown> = {};

      if (currentIngredient.position !== next.position) {
        nextPatch.position = next.position;
      }

      if (currentIngredient._id === ingredientId) {
        if (patch.name !== undefined) {
          nextPatch.name = patch.name;
        }
        if (patch.quantity !== undefined) {
          nextPatch.quantity = patch.quantity;
        }
        if (patch.unit !== undefined) {
          nextPatch.unit = patch.unit;
        }
        if (patch.notes !== undefined) {
          nextPatch.notes = patch.notes;
        }
        if (patch.purchased !== undefined) {
          nextPatch.purchased = patch.purchased;
        }
      }

      if (Object.keys(nextPatch).length > 0) {
        nextPatch.updatedAt = now;
        await ctx.db.patch(currentIngredient._id, nextPatch);
      }
    }

    await touchRecipe(ctx.db, ingredient.recipeId, now);

    const updated = await ctx.db.get(ingredientId);

    if (!updated) {
      throw new Error("Ingredient not found");
    }

    return serializeIngredient(updated);
  }
});

export const deleteIngredient = mutation({
  args: {
    ingredientId: v.id("recipeIngredients")
  },
  handler: async (ctx, { ingredientId }) => {
    const ingredient = await ctx.db.get(ingredientId);

    if (!ingredient) {
      throw new Error("Ingredient not found");
    }

    await requireEditableRecipe(ctx, ingredient.recipeId);

    const now = Date.now();
    const ingredients = await loadIngredients(ctx.db, ingredient.recipeId);

    await ctx.db.delete(ingredientId);

    const nextPositions = removeRecord(
      ingredients.map((currentIngredient) => ({
        id: currentIngredient._id,
        position: currentIngredient.position
      })),
      ingredientId
    );

    for (const next of nextPositions) {
      const currentIngredient = ingredients.find((record) => record._id === next.id);

      if (currentIngredient && currentIngredient.position !== next.position) {
        await ctx.db.patch(currentIngredient._id, {
          position: next.position,
          updatedAt: now
        });
      }
    }

    await touchRecipe(ctx.db, ingredient.recipeId, now);
    return null;
  }
});

export const resetIngredients = mutation({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    await requireEditableRecipe(ctx, recipeId);

    const now = Date.now();
    const ingredients = await loadIngredients(ctx.db, recipeId);

    for (const ingredient of ingredients) {
      if (ingredient.purchased) {
        await ctx.db.patch(ingredient._id, {
          purchased: false,
          updatedAt: now
        });
      }
    }

    await touchRecipe(ctx.db, recipeId, now);
    return null;
  }
});

export const createStep = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.string(),
    instructions: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.number()),
    timerDurationSeconds: v.optional(v.union(v.number(), v.null()))
  },
  handler: async (ctx, { recipeId, ...input }) => {
    await requireEditableRecipe(ctx, recipeId);

    const step = validateStepInput(input);
    const now = Date.now();
    const currentSteps = await loadSteps(ctx.db, recipeId);
    const nextPosition = clampPosition(step.position, 1, currentSteps.length + 1);

    for (const existingStep of currentSteps) {
      if (existingStep.position >= nextPosition) {
        await ctx.db.patch(existingStep._id, {
          position: existingStep.position + 1,
          updatedAt: now
        });
      }
    }

    const stepId = await ctx.db.insert("recipeSteps", {
      recipeId,
      title: step.title,
      instructions: step.instructions,
      position: nextPosition,
      timerDurationSeconds: step.timerDurationSeconds,
      timerStartedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    });

    await touchRecipe(ctx.db, recipeId, now);

    const created = await ctx.db.get(stepId);

    if (!created) {
      throw new Error("Step could not be created");
    }

    return serializeStep(created);
  }
});

export const updateStep = mutation({
  args: {
    stepId: v.id("recipeSteps"),
    title: v.optional(v.string()),
    instructions: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.number()),
    timerDurationSeconds: v.optional(v.union(v.number(), v.null()))
  },
  handler: async (ctx, { stepId, ...input }) => {
    const step = await ctx.db.get(stepId);

    if (!step) {
      throw new Error("Step not found");
    }

    await requireEditableRecipe(ctx, step.recipeId);

    const patch = validateStepPatch(input);
    const now = Date.now();
    const steps = await loadSteps(ctx.db, step.recipeId);
    const nextPositions = reorderRecords(
      steps.map((currentStep) => ({
        id: currentStep._id,
        position: currentStep.position
      })),
      stepId,
      patch.position ?? step.position
    );

    for (const next of nextPositions) {
      const currentStep = steps.find((record) => record._id === next.id);

      if (!currentStep) {
        continue;
      }

      const nextPatch: Record<string, unknown> = {};

      if (currentStep.position !== next.position) {
        nextPatch.position = next.position;
      }

      if (currentStep._id === stepId) {
        if (patch.title !== undefined) {
          nextPatch.title = patch.title;
        }
        if (patch.instructions !== undefined) {
          nextPatch.instructions = patch.instructions;
        }
        if (patch.timerDurationSeconds !== undefined) {
          nextPatch.timerDurationSeconds = patch.timerDurationSeconds;
        }
      }

      if (Object.keys(nextPatch).length > 0) {
        nextPatch.updatedAt = now;
        await ctx.db.patch(currentStep._id, nextPatch);
      }
    }

    await touchRecipe(ctx.db, step.recipeId, now);

    const updated = await ctx.db.get(stepId);

    if (!updated) {
      throw new Error("Step not found");
    }

    return serializeStep(updated);
  }
});

export const deleteStep = mutation({
  args: {
    stepId: v.id("recipeSteps")
  },
  handler: async (ctx, { stepId }) => {
    const step = await ctx.db.get(stepId);

    if (!step) {
      throw new Error("Step not found");
    }

    await requireEditableRecipe(ctx, step.recipeId);

    const now = Date.now();
    const steps = await loadSteps(ctx.db, step.recipeId);

    await ctx.db.delete(stepId);

    const nextPositions = removeRecord(
      steps.map((currentStep) => ({
        id: currentStep._id,
        position: currentStep.position
      })),
      stepId
    );

    for (const next of nextPositions) {
      const currentStep = steps.find((record) => record._id === next.id);

      if (currentStep && currentStep.position !== next.position) {
        await ctx.db.patch(currentStep._id, {
          position: next.position,
          updatedAt: now
        });
      }
    }

    await touchRecipe(ctx.db, step.recipeId, now);
    return null;
  }
});

export const startStepTimer = mutation({
  args: {
    stepId: v.id("recipeSteps")
  },
  handler: async (ctx, { stepId }) => {
    const step = await ctx.db.get(stepId);

    if (!step) {
      throw new Error("Step not found");
    }

    await requireEditableRecipe(ctx, step.recipeId);

    const now = Date.now();

    await ctx.db.patch(stepId, {
      timerStartedAt: now,
      updatedAt: now
    });
    await touchRecipe(ctx.db, step.recipeId, now);

    const updated = await ctx.db.get(stepId);

    if (!updated) {
      throw new Error("Step not found");
    }

    return serializeStep(updated);
  }
});

export const completeStep = mutation({
  args: {
    stepId: v.id("recipeSteps")
  },
  handler: async (ctx, { stepId }) => {
    const step = await ctx.db.get(stepId);

    if (!step) {
      throw new Error("Step not found");
    }

    await requireEditableRecipe(ctx, step.recipeId);

    const now = Date.now();

    await ctx.db.patch(stepId, {
      completedAt: now,
      updatedAt: now
    });
    await touchRecipe(ctx.db, step.recipeId, now);

    const updated = await ctx.db.get(stepId);

    if (!updated) {
      throw new Error("Step not found");
    }

    return serializeStep(updated);
  }
});

export const resetStep = mutation({
  args: {
    stepId: v.id("recipeSteps")
  },
  handler: async (ctx, { stepId }) => {
    const step = await ctx.db.get(stepId);

    if (!step) {
      throw new Error("Step not found");
    }

    await requireEditableRecipe(ctx, step.recipeId);

    const now = Date.now();

    await ctx.db.patch(stepId, {
      completedAt: null,
      timerStartedAt: null,
      updatedAt: now
    });
    await touchRecipe(ctx.db, step.recipeId, now);

    const updated = await ctx.db.get(stepId);

    if (!updated) {
      throw new Error("Step not found");
    }

    return serializeStep(updated);
  }
});

export const resetAllSteps = mutation({
  args: {
    recipeId: v.id("recipes")
  },
  handler: async (ctx, { recipeId }) => {
    await requireEditableRecipe(ctx, recipeId);

    const now = Date.now();
    const steps = await loadSteps(ctx.db, recipeId);

    for (const step of steps) {
      if (step.completedAt != null || step.timerStartedAt != null) {
        await ctx.db.patch(step._id, {
          completedAt: null,
          timerStartedAt: null,
          updatedAt: now
        });
      }
    }

    await touchRecipe(ctx.db, recipeId, now);
    return null;
  }
});

export const addRecipeCollaborator = mutation({
  args: {
    recipeId: v.id("recipes"),
    email: v.string()
  },
  handler: async (ctx, { recipeId, email }) => {
    const { identity } = await requireOwnedRecipe(ctx, recipeId);
    const collaboratorEmail = normalizeEmail(email);

    if (!collaboratorEmail) {
      throw new Error("Collaborator email is required");
    }

    if (!identity.emailNormalized) {
      throw new Error("Your account must have an email address to do that");
    }

    if (!identity.emailVerified) {
      throw new Error("Verify your email address before managing collaborator access");
    }

    if (collaboratorEmail === identity.emailNormalized) {
      throw new Error("You already own this recipe");
    }

    const existing = await findCollaboratorByEmail(ctx.db, recipeId, collaboratorEmail);

    if (existing) {
      throw new Error("That collaborator already has access");
    }

    const now = Date.now();
    const collaboratorId = await ctx.db.insert("recipeCollaborators", {
      recipeId,
      collaboratorEmail,
      addedByTokenIdentifier: identity.tokenIdentifier,
      createdAt: now
    });

    await touchRecipe(ctx.db, recipeId, now);

    const collaborator = await ctx.db.get(collaboratorId);

    if (!collaborator) {
      throw new Error("Collaborator could not be added");
    }

    return serializeCollaborator(collaborator, identity.emailNormalized);
  }
});

export const removeRecipeCollaborator = mutation({
  args: {
    recipeId: v.id("recipes"),
    collaboratorId: v.id("recipeCollaborators")
  },
  handler: async (ctx, { recipeId, collaboratorId }) => {
    await requireOwnedRecipe(ctx, recipeId);
    const collaborator = await ctx.db.get(collaboratorId);

    if (!collaborator || collaborator.recipeId !== recipeId) {
      throw new Error("Collaborator not found");
    }

    await ctx.db.delete(collaboratorId);
    await touchRecipe(ctx.db, recipeId, Date.now());
    return null;
  }
});
