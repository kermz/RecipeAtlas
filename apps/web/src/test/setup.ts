import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetMockRecipeStore } from './mock-recipe-store';

afterEach(() => {
  window.localStorage.clear();
  resetMockRecipeStore();
});
