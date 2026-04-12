import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, mock } from 'bun:test';
import { resetMockRecipeStore } from './mock-recipe-store';
import { resetMockAuthHookState } from './mocks/auth-hooks';

const animate: typeof Element.prototype.animate = () => ({
  cancel() {},
  finished: Promise.resolve(),
  play() {}
} as unknown as Animation);

if (globalThis.Element?.prototype) {
  globalThis.Element.prototype.animate ??= animate;
}

if (globalThis.HTMLElement?.prototype) {
  globalThis.HTMLElement.prototype.animate ??= animate;
}

afterEach(() => {
  mock.restore();
  cleanup();
  window.localStorage.clear();
  resetMockAuthHookState();
  resetMockRecipeStore();
});
