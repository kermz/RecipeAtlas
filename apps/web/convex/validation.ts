import type { IngredientUnit } from "./ingredient_units";

const ingredientUnits = new Set<IngredientUnit>(["g", "kg", "oz", "lb", "ml", "l", "tsp", "Tbs", "cup", "fl-oz", "pcs"]);
const recipeVisibilities = new Set(["private", "public"]);

function normalizeOptionalText(value: string | null | undefined, maxLength: number, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredText(value: string, maxLength: number, fieldName: string) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }

  return trimmed;
}

function normalizeVisibility(value: string | undefined, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (!recipeVisibilities.has(value)) {
    throw new Error(`${fieldName} is invalid`);
  }

  return value as "private" | "public";
}

export function validateRecipeInput(input: { title: string; description?: string | null; visibility?: string }) {
  return {
    title: normalizeRequiredText(input.title, 120, "Title"),
    description: normalizeOptionalText(input.description, 2000, "Description") ?? null,
    visibility: normalizeVisibility(input.visibility, "Visibility") ?? "private"
  };
}

export function validateRecipePatch(input: { title?: string; description?: string | null; visibility?: string }) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field is required");
  }

  return {
    title: input.title === undefined ? undefined : normalizeRequiredText(input.title, 120, "Title"),
    description: normalizeOptionalText(input.description, 2000, "Description"),
    visibility: normalizeVisibility(input.visibility, "Visibility")
  };
}

export function validateIngredientInput(input: {
  name: string;
  quantity: number;
  unit: IngredientUnit;
  notes?: string | null;
  purchased?: boolean;
  position?: number;
}) {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 100000) {
    throw new Error("Quantity must be greater than 0 and less than or equal to 100000");
  }

  if (!ingredientUnits.has(input.unit)) {
    throw new Error("Unit is invalid");
  }

  return {
    name: normalizeRequiredText(input.name, 160, "Ingredient name"),
    quantity: input.quantity,
    unit: input.unit,
    notes: normalizeOptionalText(input.notes, 1000, "Notes") ?? null,
    purchased: input.purchased ?? false,
    position: input.position
  };
}

export function validateIngredientPatch(input: {
  name?: string;
  quantity?: number;
  unit?: IngredientUnit;
  notes?: string | null;
  purchased?: boolean;
  position?: number;
}) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field is required");
  }

  if (input.quantity !== undefined && (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 100000)) {
    throw new Error("Quantity must be greater than 0 and less than or equal to 100000");
  }

  if (input.unit !== undefined && !ingredientUnits.has(input.unit)) {
    throw new Error("Unit is invalid");
  }

  return {
    name: input.name === undefined ? undefined : normalizeRequiredText(input.name, 160, "Ingredient name"),
    quantity: input.quantity,
    unit: input.unit,
    notes: normalizeOptionalText(input.notes, 1000, "Notes"),
    purchased: input.purchased,
    position: input.position
  };
}

export function validateStepInput(input: {
  title: string;
  instructions?: string | null;
  position?: number;
  timerDurationSeconds?: number | null;
}) {
  if (
    input.timerDurationSeconds !== undefined &&
    input.timerDurationSeconds !== null &&
    (!Number.isInteger(input.timerDurationSeconds) || input.timerDurationSeconds < 1 || input.timerDurationSeconds > 24 * 60 * 60)
  ) {
    throw new Error("Timer duration must be between 1 second and 24 hours");
  }

  return {
    title: normalizeRequiredText(input.title, 160, "Title"),
    instructions: normalizeOptionalText(input.instructions, 4000, "Instructions") ?? null,
    position: input.position,
    timerDurationSeconds: input.timerDurationSeconds ?? null
  };
}

export function validateStepPatch(input: {
  title?: string;
  instructions?: string | null;
  position?: number;
  timerDurationSeconds?: number | null;
}) {
  if (Object.keys(input).length === 0) {
    throw new Error("At least one field is required");
  }

  if (
    input.timerDurationSeconds !== undefined &&
    input.timerDurationSeconds !== null &&
    (!Number.isInteger(input.timerDurationSeconds) || input.timerDurationSeconds < 1 || input.timerDurationSeconds > 24 * 60 * 60)
  ) {
    throw new Error("Timer duration must be between 1 second and 24 hours");
  }

  return {
    title: input.title === undefined ? undefined : normalizeRequiredText(input.title, 160, "Title"),
    instructions: normalizeOptionalText(input.instructions, 4000, "Instructions"),
    position: input.position,
    timerDurationSeconds: input.timerDurationSeconds
  };
}
