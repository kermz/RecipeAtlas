export interface RecipeRecord {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeStepRecord {
  id: string;
  recipeId: string;
  position: number;
  title: string;
  instructions: string | null;
  timerDurationSeconds: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeCreateInput {
  title: string;
  description?: string | null;
}

export interface RecipeUpdateInput {
  title?: string;
  description?: string | null;
}

export interface RecipeStepCreateInput {
  title: string;
  instructions?: string | null;
  position: number;
  timerDurationSeconds?: number | null;
}

export interface RecipeStepUpdateInput {
  title?: string;
  instructions?: string | null;
  timerDurationSeconds?: number | null;
  completedAt?: Date | null;
}

export interface RecipeRepository {
  listRecipes(): Promise<RecipeRecord[]>;
  findRecipeById(id: string): Promise<RecipeRecord | null>;
  createRecipe(input: Required<Pick<RecipeCreateInput, "title">> & { description: string | null }): Promise<RecipeRecord>;
  updateRecipe(id: string, input: RecipeUpdateInput): Promise<RecipeRecord | null>;
  deleteRecipe(id: string): Promise<boolean>;
  listStepsByRecipe(recipeId: string): Promise<RecipeStepRecord[]>;
  findStepById(id: string): Promise<RecipeStepRecord | null>;
  createStep(recipeId: string, input: Required<Pick<RecipeStepCreateInput, "title" | "position">> & { instructions: string | null; timerDurationSeconds: number | null }): Promise<RecipeStepRecord>;
  updateStep(id: string, input: RecipeStepUpdateInput): Promise<RecipeStepRecord | null>;
  deleteStep(id: string): Promise<boolean>;
  replaceRecipeStepOrder(recipeId: string, orderedStepIds: string[]): Promise<void>;
}
