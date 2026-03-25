import { NotFoundError } from "./errors";
import type {
  RecipeCreateInput,
  RecipeRecord,
  RecipeRepository,
  RecipeStepCreateInput,
  RecipeStepRecord,
  RecipeStepUpdateInput,
  RecipeUpdateInput
} from "./types";

export interface RecipeWithSteps extends RecipeRecord {
  steps: RecipeStepRecord[];
}

function sortSteps(steps: RecipeStepRecord[]): RecipeStepRecord[] {
  return [...steps].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    if (left.createdAt.getTime() !== right.createdAt.getTime()) {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }

    return left.id.localeCompare(right.id);
  });
}

function clampPosition(position: number, count: number): number {
  return Math.min(Math.max(position - 1, 0), count);
}

export class RecipeService {
  constructor(
    private readonly repository: RecipeRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  async listRecipes(): Promise<RecipeRecord[]> {
    return this.repository.listRecipes();
  }

  async getRecipe(id: string): Promise<RecipeWithSteps> {
    const recipe = await this.repository.findRecipeById(id);

    if (!recipe) {
      throw new NotFoundError("Recipe not found");
    }

    const steps = await this.repository.listStepsByRecipe(recipe.id);

    return {
      ...recipe,
      steps: sortSteps(steps)
    };
  }

  async createRecipe(input: RecipeCreateInput): Promise<RecipeRecord> {
    return this.repository.createRecipe({
      title: input.title,
      description: input.description ?? null
    });
  }

  async updateRecipe(id: string, input: RecipeUpdateInput): Promise<RecipeRecord> {
    const recipe = await this.repository.updateRecipe(id, input);

    if (!recipe) {
      throw new NotFoundError("Recipe not found");
    }

    return recipe;
  }

  async deleteRecipe(id: string): Promise<void> {
    const deleted = await this.repository.deleteRecipe(id);

    if (!deleted) {
      throw new NotFoundError("Recipe not found");
    }
  }

  async createStep(recipeId: string, input: RecipeStepCreateInput): Promise<RecipeStepRecord> {
    const recipe = await this.repository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundError("Recipe not found");
    }

    const created = await this.repository.createStep(recipeId, {
      title: input.title,
      position: input.position,
      instructions: input.instructions ?? null,
      timerDurationSeconds: input.timerDurationSeconds ?? null
    });

    await this.reorderRecipeSteps(recipeId, created.id, input.position);

    return this.requireStep(created.id);
  }

  async updateStep(id: string, input: RecipeStepUpdateInput & { position?: number }): Promise<RecipeStepRecord> {
    const current = await this.requireStep(id);

    const updated = await this.repository.updateStep(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.timerDurationSeconds !== undefined ? { timerDurationSeconds: input.timerDurationSeconds } : {})
    });

    if (!updated) {
      throw new NotFoundError("Step not found");
    }

    const desiredPosition = "position" in input && input.position !== undefined ? input.position : current.position;
    await this.reorderRecipeSteps(current.recipeId, id, desiredPosition);

    return this.requireStep(id);
  }

  async deleteStep(id: string): Promise<void> {
    const current = await this.requireStep(id);
    const deleted = await this.repository.deleteStep(id);

    if (!deleted) {
      throw new NotFoundError("Step not found");
    }

    await this.reorderRecipeSteps(current.recipeId);
  }

  async completeStep(id: string): Promise<RecipeStepRecord> {
    await this.requireStep(id);
    const completed = await this.repository.updateStep(id, { completedAt: this.now() });

    if (!completed) {
      throw new NotFoundError("Step not found");
    }

    return completed;
  }

  async resetStep(id: string): Promise<RecipeStepRecord> {
    await this.requireStep(id);
    const reset = await this.repository.updateStep(id, { completedAt: null });

    if (!reset) {
      throw new NotFoundError("Step not found");
    }

    return reset;
  }

  private async requireStep(id: string): Promise<RecipeStepRecord> {
    const step = await this.repository.findStepById(id);

    if (!step) {
      throw new NotFoundError("Step not found");
    }

    return step;
  }

  private async reorderRecipeSteps(recipeId: string, activeStepId?: string, desiredPosition?: number): Promise<void> {
    const orderedSteps = sortSteps(await this.repository.listStepsByRecipe(recipeId));
    const orderedIds = orderedSteps.map((step) => step.id);

    if (activeStepId) {
      const filtered = orderedIds.filter((stepId) => stepId !== activeStepId);
      const insertAt = clampPosition(desiredPosition ?? filtered.length + 1, filtered.length);
      filtered.splice(insertAt, 0, activeStepId);
      await this.repository.replaceRecipeStepOrder(recipeId, filtered);
      return;
    }

    await this.repository.replaceRecipeStepOrder(recipeId, orderedIds);
  }
}
