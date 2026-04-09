import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    ownerName: v.string(),
    ownerTokenIdentifier: v.string(),
    visibility: v.union(v.literal("private"), v.literal("public")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_updatedAt", ["updatedAt"])
    .index("by_ownerTokenIdentifier_and_updatedAt", ["ownerTokenIdentifier", "updatedAt"])
    .index("by_visibility_and_updatedAt", ["visibility", "updatedAt"]),
  recipeCollaborators: defineTable({
    recipeId: v.id("recipes"),
    collaboratorEmail: v.string(),
    addedByTokenIdentifier: v.string(),
    createdAt: v.number()
  })
    .index("by_recipeId_and_collaboratorEmail", ["recipeId", "collaboratorEmail"])
    .index("by_collaboratorEmail_and_createdAt", ["collaboratorEmail", "createdAt"]),
  recipeSteps: defineTable({
    recipeId: v.id("recipes"),
    title: v.string(),
    instructions: v.optional(v.union(v.string(), v.null())),
    position: v.number(),
    timerDurationSeconds: v.optional(v.union(v.number(), v.null())),
    timerStartedAt: v.optional(v.union(v.number(), v.null())),
    completedAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_recipe_position", ["recipeId", "position"]),
  recipeIngredients: defineTable({
    recipeId: v.id("recipes"),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.union(v.string(), v.null())),
    purchased: v.boolean(),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_recipe_position", ["recipeId", "position"])
});
