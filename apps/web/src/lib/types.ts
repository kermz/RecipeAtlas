export type Id = string;
export type RecipeVisibility = 'private' | 'public';
export type RecipeCollaborator = {
  id: Id;
  recipeId: Id;
  email: string;
  isCurrentUser: boolean;
  createdAt: string;
};

export type IngredientUnit = 'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l' | 'tsp' | 'Tbs' | 'cup' | 'fl-oz' | 'pcs';

export type RecipeIngredient = {
  id: Id;
  recipeId: Id;
  position: number;
  name: string;
  quantity: number;
  unit: IngredientUnit;
  notes: string | null;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeSummary = {
  id: Id;
  title: string;
  description: string | null;
  ownerName: string;
  visibility: RecipeVisibility;
  isOwner: boolean;
  isCollaborator: boolean;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
  collaboratorCount?: number;
  collaborators?: RecipeCollaborator[];
  ingredientsCount?: number;
  ingredients?: RecipeIngredient[];
  stepsCount?: number;
  steps?: RecipeStep[];
};

export type RecipeStep = {
  id: Id;
  recipeId: Id;
  position: number;
  title: string;
  instructions: string | null;
  timerDurationSeconds: number | null;
  timerStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeDetail = RecipeSummary & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type RecipeInput = {
  title: string;
  description?: string | null;
  visibility?: RecipeVisibility;
};

export type RecipeStepInput = {
  title: string;
  instructions?: string | null;
  position: number;
  timerDurationSeconds?: number | null;
};

export type RecipeIngredientInput = {
  name: string;
  quantity: number;
  unit: IngredientUnit;
  notes?: string | null;
  purchased?: boolean;
  position: number;
};
