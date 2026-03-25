import { Prisma, PrismaClient } from "@prisma/client";
import { BadRequestError } from "./errors";
import type {
  RecipeCreateInput,
  RecipeRecord,
  RecipeRepository,
  RecipeStepCreateInput,
  RecipeStepRecord,
  RecipeStepUpdateInput,
  RecipeUpdateInput
} from "./types";

function toRecipe(record: {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RecipeRecord {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function toStep(record: {
  id: string;
  recipeId: string;
  position: number;
  title: string;
  instructions: string | null;
  timerDurationSeconds: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RecipeStepRecord {
  return {
    id: record.id,
    recipeId: record.recipeId,
    position: record.position,
    title: record.title,
    instructions: record.instructions,
    timerDurationSeconds: record.timerDurationSeconds,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export class PrismaRecipeRepository implements RecipeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRecipes() {
    const recipes = await this.prisma.recipe.findMany({
      orderBy: [
        { createdAt: "desc" },
        { id: "asc" }
      ]
    });

    return recipes.map(toRecipe);
  }

  async findRecipeById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id }
    });

    return recipe ? toRecipe(recipe) : null;
  }

  async createRecipe(input: RecipeCreateInput & { title: string; description: string | null }) {
    const recipe = await this.prisma.recipe.create({
      data: {
        title: input.title,
        description: input.description
      }
    });

    return toRecipe(recipe);
  }

  async updateRecipe(id: string, input: RecipeUpdateInput) {
    try {
      const recipe = await this.prisma.recipe.update({
        where: { id },
        data: input
      });

      return toRecipe(recipe);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteRecipe(id: string) {
    try {
      await this.prisma.recipe.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }

  async listStepsByRecipe(recipeId: string) {
    const steps = await this.prisma.recipeStep.findMany({
      where: { recipeId },
      orderBy: [
        { position: "asc" },
        { createdAt: "asc" },
        { id: "asc" }
      ]
    });

    return steps.map(toStep);
  }

  async findStepById(id: string) {
    const step = await this.prisma.recipeStep.findUnique({
      where: { id }
    });

    return step ? toStep(step) : null;
  }

  async createStep(recipeId: string, input: RecipeStepCreateInput & { title: string; position: number; instructions: string | null; timerDurationSeconds: number | null }) {
    const step = await this.prisma.recipeStep.create({
      data: {
        recipeId,
        title: input.title,
        position: input.position,
        instructions: input.instructions,
        timerDurationSeconds: input.timerDurationSeconds
      }
    });

    return toStep(step);
  }

  async updateStep(id: string, input: RecipeStepUpdateInput) {
    try {
      const step = await this.prisma.recipeStep.update({
        where: { id },
        data: input
      });

      return toStep(step);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteStep(id: string) {
    try {
      await this.prisma.recipeStep.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }

  async replaceRecipeStepOrder(recipeId: string, orderedStepIds: string[]) {
    const currentSteps = await this.prisma.recipeStep.findMany({
      where: { recipeId },
      select: { id: true }
    });
    const orderedStepIdSet = new Set(orderedStepIds);

    if (orderedStepIdSet.size !== orderedStepIds.length) {
      throw new BadRequestError("Step order contains duplicate step ids");
    }

    if (currentSteps.length !== orderedStepIds.length) {
      throw new BadRequestError("Step order does not match recipe contents");
    }

    const currentStepIds = new Set(currentSteps.map((step) => step.id));

    for (const stepId of orderedStepIds) {
      if (!currentStepIds.has(stepId)) {
        throw new BadRequestError("Step order contains a step that does not belong to the recipe");
      }
    }

    await this.prisma.$transaction(
      orderedStepIds.map((stepId, index) =>
        this.prisma.recipeStep.update({
          where: { id: stepId },
          data: { position: index + 1 }
        })
      )
    );
  }
}
