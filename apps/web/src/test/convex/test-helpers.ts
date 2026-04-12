type RecipeRecord = {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string | null;
  ownerName: string;
  ownerTokenIdentifier: string;
  visibility: "private" | "public";
  createdAt: number;
  updatedAt: number;
};

type CollaboratorRecord = {
  _id: string;
  _creationTime: number;
  recipeId: string;
  collaboratorEmail: string;
  addedByTokenIdentifier: string;
  createdAt: number;
};

type IngredientRecord = {
  _id: string;
  _creationTime: number;
  recipeId: string;
  position: number;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  purchased: boolean;
  createdAt: number;
  updatedAt: number;
};

type StepRecord = {
  _id: string;
  _creationTime: number;
  recipeId: string;
  position: number;
  title: string;
  instructions?: string | null;
  timerDurationSeconds?: number | null;
  timerStartedAt?: number | null;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
};

type TableName = "recipes" | "recipeCollaborators" | "recipeIngredients" | "recipeSteps";
type TableRecord = RecipeRecord | CollaboratorRecord | IngredientRecord | StepRecord;

class QueryRange {
  constraints: Record<string, unknown> = {};

  eq(field: string, value: unknown) {
    this.constraints[field] = value;
    return this;
  }
}

class QueryBuilder {
  private indexName: string | null = null;
  private constraints: Record<string, unknown> = {};
  private direction: "asc" | "desc" = "asc";
  private limit: number | null = null;

  constructor(
    private readonly table: TableName,
    private readonly getRecords: () => TableRecord[]
  ) {}

  withIndex(indexName: string, builder?: (range: QueryRange) => unknown) {
    this.indexName = indexName;

    if (builder) {
      const range = new QueryRange();
      builder(range);
      this.constraints = range.constraints;
    }

    return this;
  }

  order(direction: "asc" | "desc") {
    this.direction = direction;
    return this;
  }

  async take(limit: number) {
    this.limit = limit;
    return this.collect();
  }

  async collect() {
    const records = this.getRecords()
      .filter((record) =>
        Object.entries(this.constraints).every(([field, value]) => (record as Record<string, unknown>)[field] === value)
      )
      .sort((left, right) => this.compare(left, right));

    const limitedRecords = this.limit === null ? records : records.slice(0, this.limit);

    return limitedRecords.map((record) => structuredClone(record));
  }

  private compare(left: TableRecord, right: TableRecord) {
    const factor = this.direction === "desc" ? -1 : 1;

    if (this.indexName === "by_updatedAt") {
      const leftUpdatedAt = (left as RecipeRecord).updatedAt;
      const rightUpdatedAt = (right as RecipeRecord).updatedAt;

      if (leftUpdatedAt !== rightUpdatedAt) {
        return (leftUpdatedAt - rightUpdatedAt) * factor;
      }
    }

    if (this.indexName === "by_recipe_position") {
      const leftPosition = (left as IngredientRecord | StepRecord).position;
      const rightPosition = (right as IngredientRecord | StepRecord).position;

      if (leftPosition !== rightPosition) {
        return (leftPosition - rightPosition) * factor;
      }
    }

    if (this.indexName === "by_ownerTokenIdentifier_and_updatedAt" || this.indexName === "by_visibility_and_updatedAt") {
      const leftUpdatedAt = (left as RecipeRecord).updatedAt;
      const rightUpdatedAt = (right as RecipeRecord).updatedAt;

      if (leftUpdatedAt !== rightUpdatedAt) {
        return (leftUpdatedAt - rightUpdatedAt) * factor;
      }
    }

    if (this.indexName === "by_collaboratorEmail_and_createdAt") {
      const leftCreatedAt = (left as CollaboratorRecord).createdAt;
      const rightCreatedAt = (right as CollaboratorRecord).createdAt;

      if (leftCreatedAt !== rightCreatedAt) {
        return (leftCreatedAt - rightCreatedAt) * factor;
      }
    }

    return (left._creationTime - right._creationTime) * factor;
  }
}

export function createConvexTestAuth(
  tokenIdentifier: string | null = "token-1",
  email: string | null = "chef@example.com",
  emailVerified = true
) {
  return {
    async getUserIdentity() {
      if (!tokenIdentifier) {
        return null;
      }

      return {
        tokenIdentifier,
        name: "Recipe Tester",
        email,
        emailVerified
      };
    }
  };
}

export function createConvexTestDb() {
  const tables = {
    recipes: new Map<string, RecipeRecord>(),
    recipeCollaborators: new Map<string, CollaboratorRecord>(),
    recipeIngredients: new Map<string, IngredientRecord>(),
    recipeSteps: new Map<string, StepRecord>()
  };
  const counters = {
    recipes: 1,
    recipeCollaborators: 1,
    recipeIngredients: 1,
    recipeSteps: 1
  };

  function getTable(table: TableName) {
    return tables[table];
  }

  function getRecord(id: string) {
    return (
      tables.recipes.get(id) ??
      tables.recipeCollaborators.get(id) ??
      tables.recipeIngredients.get(id) ??
      tables.recipeSteps.get(id) ??
      null
    );
  }

  return {
    async get(id: string) {
      const record = getRecord(id);
      return record ? structuredClone(record) : null;
    },
    async insert(table: TableName, value: Omit<TableRecord, "_id" | "_creationTime">) {
      const prefix =
        table === "recipes"
          ? "recipe"
          : table === "recipeCollaborators"
            ? "collaborator"
            : table === "recipeIngredients"
              ? "ingredient"
              : "step";
      const id = `${prefix}-${counters[table]++}`;
      const record = {
        ...value,
        _id: id,
        _creationTime: Date.now()
      } as TableRecord;

      getTable(table).set(id, record as never);
      return id;
    },
    async patch(id: string, value: Record<string, unknown>) {
      const record = getRecord(id);

      if (!record) {
        throw new Error(`Record not found: ${id}`);
      }

      const nextRecord = {
        ...record,
        ...value
      };

      if (tables.recipes.has(id)) {
        tables.recipes.set(id, nextRecord as RecipeRecord);
        return;
      }

      if (tables.recipeCollaborators.has(id)) {
        tables.recipeCollaborators.set(id, nextRecord as CollaboratorRecord);
        return;
      }

      if (tables.recipeIngredients.has(id)) {
        tables.recipeIngredients.set(id, nextRecord as IngredientRecord);
        return;
      }

      tables.recipeSteps.set(id, nextRecord as StepRecord);
    },
    async delete(id: string) {
      tables.recipes.delete(id);
      tables.recipeCollaborators.delete(id);
      tables.recipeIngredients.delete(id);
      tables.recipeSteps.delete(id);
    },
    query(table: TableName) {
      return new QueryBuilder(table, () => [...getTable(table).values()]);
    },
    tables
  };
}
