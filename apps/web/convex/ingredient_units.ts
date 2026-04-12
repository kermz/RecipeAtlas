import { v } from "convex/values";

export type IngredientUnit =
  | "g"
  | "kg"
  | "oz"
  | "lb"
  | "ml"
  | "l"
  | "tsp"
  | "Tbs"
  | "cup"
  | "fl-oz"
  | "pcs";

export const ingredientUnitValidator = v.union(
  v.literal("g"),
  v.literal("kg"),
  v.literal("oz"),
  v.literal("lb"),
  v.literal("ml"),
  v.literal("l"),
  v.literal("tsp"),
  v.literal("Tbs"),
  v.literal("cup"),
  v.literal("fl-oz"),
  v.literal("pcs")
);
