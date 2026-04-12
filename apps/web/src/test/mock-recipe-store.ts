import { useMemo, useRef, useSyncExternalStore } from 'react';

import type { RecipeCollaborator, RecipeDetail, RecipeIngredient, RecipeStep, RecipeSummary, RecipeVisibility } from '../lib/types';

type MockUser = {
  id: string;
  name: string;
  email: string;
  tokenIdentifier: string;
};

type MockSession = {
  session: {
    id: string;
  };
  user: MockUser;
};

type MockPasskey = {
  id: string;
  name?: string;
  publicKey: string;
  userId: string;
  credentialID: string;
  counter: number;
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  transports?: string;
  createdAt: string;
  aaguid?: string;
};

type RecipeRecord = {
  id: string;
  title: string;
  description: string | null;
  ownerName: string;
  ownerTokenIdentifier: string;
  visibility: RecipeVisibility;
  createdAt: string;
  updatedAt: string;
};

type RecipeCollaboratorRecord = {
  id: string;
  recipeId: string;
  collaboratorEmail: string;
  createdAt: string;
};

type StoreState = {
  currentUser: MockUser | null;
  usersByEmail: Record<string, MockUser>;
  recipes: RecipeRecord[];
  collaborators: Record<string, RecipeCollaboratorRecord[]>;
  ingredients: Record<string, RecipeIngredient[]>;
  steps: Record<string, RecipeStep[]>;
  passkeysByUserId: Record<string, MockPasskey[]>;
  recipeSeq: number;
  collaboratorSeq: number;
  ingredientSeq: number;
  stepSeq: number;
  userSeq: number;
  passkeySeq: number;
};

const listeners = new Set<() => void>();
let snapshotVersion = 0;

function now() {
  return new Date().toISOString();
}

function createUser(name: string, email: string, index: number): MockUser {
  return {
    id: `user-${index}`,
    name,
    email,
    tokenIdentifier: `token-${index}`
  };
}

function createInitialState(): StoreState {
  const timestamp = now();
  const primaryUser = createUser('Recipe Tester', 'chef@example.com', 1);

  return {
    currentUser: primaryUser,
    usersByEmail: {
      [primaryUser.email]: primaryUser
    },
    recipes: [
      {
        id: 'recipe-1',
        title: 'Sourdough Loaf',
        description: 'A simple loaf with a gentle overnight ferment.',
        ownerName: primaryUser.name,
        ownerTokenIdentifier: primaryUser.tokenIdentifier,
        visibility: 'private',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ],
    collaborators: {
      'recipe-1': []
    },
    ingredients: {
      'recipe-1': [
        {
          id: 'ingredient-1',
          recipeId: 'recipe-1',
          position: 1,
          name: 'Bread flour',
          quantity: 500,
          unit: 'g',
          notes: 'Strong white flour',
          purchased: false,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    },
    steps: {
      'recipe-1': [
        {
          id: 'step-1',
          recipeId: 'recipe-1',
          position: 1,
          title: 'Mix the dough',
          instructions: 'Combine flour, water, salt, and starter.',
          timerDurationSeconds: 120,
          timerStartedAt: null,
          completedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: 'step-2',
          recipeId: 'recipe-1',
          position: 2,
          title: 'Rest for 20 minutes',
          instructions: null,
          timerDurationSeconds: 20,
          timerStartedAt: null,
          completedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    },
    passkeysByUserId: {
      [primaryUser.id]: []
    },
    recipeSeq: 2,
    collaboratorSeq: 1,
    ingredientSeq: 2,
    stepSeq: 3,
    userSeq: 2,
    passkeySeq: 1
  };
}

let state = createInitialState();

function emit() {
  snapshotVersion += 1;
  for (const listener of listeners) {
    listener();
  }
}

function clone<T>(value: T) {
  return structuredClone(value);
}

function findRecipe(recipeId: string) {
  return state.recipes.find((recipe) => recipe.id === recipeId) ?? null;
}

function getCurrentUser() {
  return state.currentUser;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function isRecipeOwner(recipe: RecipeRecord, currentUser: MockUser | null) {
  return recipe.ownerTokenIdentifier === currentUser?.tokenIdentifier;
}

function isRecipeCollaborator(recipeId: string, currentUser: MockUser | null) {
  const collaboratorEmail = normalizeEmail(currentUser?.email);

  if (!collaboratorEmail) {
    return false;
  }

  return (state.collaborators[recipeId] ?? []).some((collaborator) => collaborator.collaboratorEmail === collaboratorEmail);
}

function canViewRecipe(recipe: RecipeRecord) {
  const currentUser = getCurrentUser();

  return recipe.visibility === 'public' || isRecipeOwner(recipe, currentUser) || isRecipeCollaborator(recipe.id, currentUser);
}

function canEditRecipe(recipe: RecipeRecord) {
  const currentUser = getCurrentUser();

  return isRecipeOwner(recipe, currentUser) || isRecipeCollaborator(recipe.id, currentUser);
}

function assertSignedIn() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    throw new Error('You must be signed in to do that');
  }

  return currentUser;
}

function assertRecipeOwner(recipeId: string) {
  const recipe = findRecipe(recipeId);
  const currentUser = assertSignedIn();

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  if (recipe.ownerTokenIdentifier !== currentUser.tokenIdentifier) {
    throw new Error('You do not have access to this recipe');
  }

  return recipe;
}

function assertEditableRecipe(recipeId: string) {
  const recipe = findRecipe(recipeId);
  assertSignedIn();

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  if (!canEditRecipe(recipe)) {
    throw new Error('You do not have access to this recipe');
  }

  return recipe;
}

function sortByPosition<T extends { position: number }>(items: T[]) {
  return [...items].sort((left, right) => left.position - right.position);
}

function sortCollaborators(recipeId: string) {
  return [...(state.collaborators[recipeId] ?? [])].sort((left, right) => left.collaboratorEmail.localeCompare(right.collaboratorEmail));
}

function toCollaborators(recipeId: string): RecipeCollaborator[] {
  const currentUser = getCurrentUser();
  const currentEmail = normalizeEmail(currentUser?.email);

  return sortCollaborators(recipeId).map((collaborator) => ({
    id: collaborator.id,
    recipeId: collaborator.recipeId,
    email: collaborator.collaboratorEmail,
    isCurrentUser: collaborator.collaboratorEmail === currentEmail,
    createdAt: collaborator.createdAt
  }));
}

function toSummary(recipe: RecipeRecord): RecipeSummary {
  const currentUser = getCurrentUser();
  const isOwner = isRecipeOwner(recipe, currentUser);
  const isCollaborator = isRecipeCollaborator(recipe.id, currentUser);

  return {
    ...clone(recipe),
    isOwner,
    isCollaborator,
    canEdit: isOwner || isCollaborator,
    collaboratorCount: state.collaborators[recipe.id]?.length ?? 0,
    collaborators: toCollaborators(recipe.id),
    ingredientsCount: state.ingredients[recipe.id]?.length ?? 0,
    stepsCount: state.steps[recipe.id]?.length ?? 0,
    ingredients: sortByPosition(state.ingredients[recipe.id] ?? []),
    steps: sortByPosition(state.steps[recipe.id] ?? [])
  };
}

function toDetail(recipe: RecipeRecord): RecipeDetail {
  return {
    ...toSummary(recipe),
    collaborators: toCollaborators(recipe.id),
    ingredients: sortByPosition(state.ingredients[recipe.id] ?? []),
    steps: sortByPosition(state.steps[recipe.id] ?? [])
  };
}

function resequence<T extends { position: number }>(items: T[]) {
  return items.map((item, index) => ({
    ...item,
    position: index + 1
  }));
}

function touchRecipe(recipeId: string, timestamp = now()) {
  const recipe = findRecipe(recipeId);

  if (recipe) {
    recipe.updatedAt = timestamp;
  }
}

function getOrCreateUser(name: string, email: string) {
  const existing = state.usersByEmail[email];

  if (existing) {
    return existing;
  }

  const user = createUser(name || email.split('@')[0] || 'Cook', email, state.userSeq++);
  state.usersByEmail = {
    ...state.usersByEmail,
    [email]: user
  };
  state.passkeysByUserId = {
    ...state.passkeysByUserId,
    [user.id]: state.passkeysByUserId[user.id] ?? []
  };
  return user;
}

export function resetMockRecipeStore() {
  state = createInitialState();
  emit();
}

export function useMockRecipeStore<T>(selector: (snapshot: StoreState) => T) {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const version = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshotVersion
  );

  return useMemo(() => selectorRef.current(state), [version]);
}

export const mockAuthActions = {
  getSession(): MockSession | null {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return null;
    }

    return {
      session: {
        id: `session-${currentUser.id}`
      },
      user: clone(currentUser)
    };
  },
  async signIn(input: { email: string; password: string }) {
    const user = getOrCreateUser(input.email.split('@')[0] || 'Cook', input.email);
    state.currentUser = user;
    emit();
    return this.getSession();
  },
  async signUp(input: { name: string; email: string; password: string }) {
    const user = getOrCreateUser(input.name, input.email);
    state.currentUser = user;
    emit();
    return this.getSession();
  },
  async signInWithPasskey() {
    const currentUser = getCurrentUser();

    if (currentUser) {
      return this.getSession();
    }

    const userWithPasskey = Object.values(state.usersByEmail).find(
      (user) => (state.passkeysByUserId[user.id] ?? []).length > 0
    );

    if (!userWithPasskey) {
      throw new Error('No saved passkey is available for this account');
    }

    state.currentUser = userWithPasskey;
    emit();
    return this.getSession();
  },
  async signOut() {
    state.currentUser = null;
    emit();
    return null;
  },
  listPasskeys() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return [];
    }

    return clone(state.passkeysByUserId[currentUser.id] ?? []);
  },
  async addPasskey(input?: { name?: string }) {
    const currentUser = assertSignedIn();
    const passkey: MockPasskey = {
      id: `passkey-${state.passkeySeq++}`,
      name: input?.name?.trim() || `Passkey ${state.passkeySeq - 1}`,
      publicKey: `public-key-${state.passkeySeq}`,
      userId: currentUser.id,
      credentialID: `credential-${state.passkeySeq}`,
      counter: 0,
      deviceType: 'singleDevice',
      backedUp: false,
      transports: 'internal',
      createdAt: now()
    };

    state.passkeysByUserId[currentUser.id] = [...(state.passkeysByUserId[currentUser.id] ?? []), passkey];
    emit();
    return clone(passkey);
  },
  async deletePasskey(passkeyId: string) {
    const currentUser = assertSignedIn();

    state.passkeysByUserId[currentUser.id] = (state.passkeysByUserId[currentUser.id] ?? []).filter(
      (passkey) => passkey.id !== passkeyId
    );
    emit();
    return null;
  }
};

export const mockRecipeActions = {
  listRecipes() {
    return [...state.recipes]
      .filter(canViewRecipe)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map(toSummary);
  },
  getRecipe(recipeId: string) {
    const recipe = findRecipe(recipeId);
    return recipe && canViewRecipe(recipe) ? toDetail(recipe) : null;
  },
  async createRecipe(input: { title: string; description?: string | null; visibility?: RecipeVisibility }) {
    const currentUser = assertSignedIn();
    const timestamp = now();
    const recipe: RecipeRecord = {
      id: `recipe-${state.recipeSeq++}`,
      title: input.title,
      description: input.description ?? null,
      ownerName: currentUser.name,
      ownerTokenIdentifier: currentUser.tokenIdentifier,
      visibility: input.visibility ?? 'private',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    state = {
      ...state,
      recipes: [recipe, ...state.recipes],
      collaborators: { ...state.collaborators, [recipe.id]: [] },
      ingredients: { ...state.ingredients, [recipe.id]: [] },
      steps: { ...state.steps, [recipe.id]: [] }
    };
    emit();
    return toDetail(recipe);
  },
  async updateRecipe(recipeId: string, input: { title?: string; description?: string | null; visibility?: RecipeVisibility }) {
    const recipe = assertRecipeOwner(recipeId);

    recipe.title = input.title ?? recipe.title;
    recipe.description = input.description === undefined ? recipe.description : input.description;
    recipe.visibility = input.visibility ?? recipe.visibility;
    recipe.updatedAt = now();
    emit();
    return toDetail(recipe);
  },
  async deleteRecipe(recipeId: string) {
    assertRecipeOwner(recipeId);

    state = {
      ...state,
      recipes: state.recipes.filter((recipe) => recipe.id !== recipeId),
      collaborators: Object.fromEntries(Object.entries(state.collaborators).filter(([id]) => id !== recipeId)),
      ingredients: Object.fromEntries(Object.entries(state.ingredients).filter(([id]) => id !== recipeId)),
      steps: Object.fromEntries(Object.entries(state.steps).filter(([id]) => id !== recipeId))
    };
    emit();
  },
  async createIngredient(recipeId: string, input: Omit<RecipeIngredient, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>) {
    assertEditableRecipe(recipeId);

    const timestamp = now();
    const nextIngredient: RecipeIngredient = {
      id: `ingredient-${state.ingredientSeq++}`,
      recipeId,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input
    };

    const ingredients = sortByPosition(state.ingredients[recipeId] ?? []);
    const insertAt = Math.min(Math.max(input.position - 1, 0), ingredients.length);
    ingredients.splice(insertAt, 0, nextIngredient);
    state.ingredients[recipeId] = resequence(ingredients);
    touchRecipe(recipeId, timestamp);
    emit();
    return clone(state.ingredients[recipeId][insertAt]);
  },
  async updateIngredient(ingredientId: string, input: Partial<Omit<RecipeIngredient, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>>) {
    for (const [recipeId, ingredients] of Object.entries(state.ingredients)) {
      const current = ingredients.find((ingredient) => ingredient.id === ingredientId);

      if (!current) {
        continue;
      }

      assertEditableRecipe(recipeId);

      const timestamp = now();
      const nextIngredients = sortByPosition(ingredients).filter((ingredient) => ingredient.id !== ingredientId);
      const nextIngredient = {
        ...current,
        ...input,
        updatedAt: timestamp
      };
      const insertAt = Math.min(Math.max((input.position ?? current.position) - 1, 0), nextIngredients.length);

      nextIngredients.splice(insertAt, 0, nextIngredient);
      state.ingredients[recipeId] = resequence(nextIngredients);
      touchRecipe(recipeId, timestamp);
      emit();
      return clone(state.ingredients[recipeId].find((ingredient) => ingredient.id === ingredientId)!);
    }

    throw new Error('Ingredient not found');
  },
  async deleteIngredient(ingredientId: string) {
    for (const [recipeId, ingredients] of Object.entries(state.ingredients)) {
      if (!ingredients.some((ingredient) => ingredient.id === ingredientId)) {
        continue;
      }

      assertEditableRecipe(recipeId);

      state.ingredients[recipeId] = resequence(ingredients.filter((ingredient) => ingredient.id !== ingredientId));
      touchRecipe(recipeId);
      emit();
      return;
    }
  },
  async resetIngredients(recipeId: string) {
    assertEditableRecipe(recipeId);

    const timestamp = now();
    state.ingredients[recipeId] = (state.ingredients[recipeId] ?? []).map((ingredient) => ({
      ...ingredient,
      purchased: false,
      updatedAt: timestamp
    }));
    touchRecipe(recipeId, timestamp);
    emit();
  },
  async createStep(recipeId: string, input: Omit<RecipeStep, 'id' | 'recipeId' | 'createdAt' | 'updatedAt' | 'timerStartedAt' | 'completedAt'> & {
    timerDurationSeconds: number | null;
  }) {
    assertEditableRecipe(recipeId);

    const timestamp = now();
    const nextStep: RecipeStep = {
      id: `step-${state.stepSeq++}`,
      recipeId,
      createdAt: timestamp,
      updatedAt: timestamp,
      timerStartedAt: null,
      completedAt: null,
      ...input
    };

    const steps = sortByPosition(state.steps[recipeId] ?? []);
    const insertAt = Math.min(Math.max(input.position - 1, 0), steps.length);
    steps.splice(insertAt, 0, nextStep);
    state.steps[recipeId] = resequence(steps);
    touchRecipe(recipeId, timestamp);
    emit();
    return clone(state.steps[recipeId][insertAt]);
  },
  async updateStep(stepId: string, input: Partial<Omit<RecipeStep, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>>) {
    for (const [recipeId, steps] of Object.entries(state.steps)) {
      const current = steps.find((step) => step.id === stepId);

      if (!current) {
        continue;
      }

      assertEditableRecipe(recipeId);

      const timestamp = now();
      const nextSteps = sortByPosition(steps).filter((step) => step.id !== stepId);
      const nextStep = {
        ...current,
        ...input,
        updatedAt: timestamp
      };
      const insertAt = Math.min(Math.max((input.position ?? current.position) - 1, 0), nextSteps.length);

      nextSteps.splice(insertAt, 0, nextStep);
      state.steps[recipeId] = resequence(nextSteps);
      touchRecipe(recipeId, timestamp);
      emit();
      return clone(state.steps[recipeId].find((step) => step.id === stepId)!);
    }

    throw new Error('Step not found');
  },
  async deleteStep(stepId: string) {
    for (const [recipeId, steps] of Object.entries(state.steps)) {
      if (!steps.some((step) => step.id === stepId)) {
        continue;
      }

      assertEditableRecipe(recipeId);

      state.steps[recipeId] = resequence(steps.filter((step) => step.id !== stepId));
      touchRecipe(recipeId);
      emit();
      return;
    }
  },
  async startStepTimer(stepId: string) {
    return this.updateStep(stepId, {
      timerStartedAt: now()
    });
  },
  async completeStep(stepId: string) {
    return this.updateStep(stepId, {
      completedAt: now()
    });
  },
  async resetStep(stepId: string) {
    return this.updateStep(stepId, {
      completedAt: null,
      timerStartedAt: null
    });
  },
  async resetAllSteps(recipeId: string) {
    assertEditableRecipe(recipeId);

    const timestamp = now();
    state.steps[recipeId] = (state.steps[recipeId] ?? []).map((step) => ({
      ...step,
      completedAt: null,
      timerStartedAt: null,
      updatedAt: timestamp
    }));
    touchRecipe(recipeId, timestamp);
    emit();
  },
  async addCollaborator(recipeId: string, email: string) {
    const owner = assertRecipeOwner(recipeId);
    const collaboratorEmail = normalizeEmail(email);

    if (!collaboratorEmail) {
      throw new Error('Collaborator email is required');
    }

    if (collaboratorEmail === normalizeEmail(getCurrentUser()?.email)) {
      throw new Error('You already own this recipe');
    }

    if ((state.collaborators[recipeId] ?? []).some((collaborator) => collaborator.collaboratorEmail === collaboratorEmail)) {
      throw new Error('That collaborator already has access');
    }

    const collaborator: RecipeCollaboratorRecord = {
      id: `collaborator-${state.collaboratorSeq++}`,
      recipeId,
      collaboratorEmail,
      createdAt: now()
    };

    state.collaborators[recipeId] = [...(state.collaborators[recipeId] ?? []), collaborator];
    touchRecipe(owner.id, collaborator.createdAt);
    emit();
    return collaborator;
  },
  async removeCollaborator(recipeId: string, collaboratorId: string) {
    assertRecipeOwner(recipeId);

    if (!(state.collaborators[recipeId] ?? []).some((collaborator) => collaborator.id === collaboratorId)) {
      throw new Error('Collaborator not found');
    }

    state.collaborators[recipeId] = (state.collaborators[recipeId] ?? []).filter((collaborator) => collaborator.id !== collaboratorId);
    touchRecipe(recipeId);
    emit();
  }
};
