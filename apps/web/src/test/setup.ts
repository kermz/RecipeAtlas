import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';
import { queryClient } from '../lib/query-client';
import { resetStore } from './handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  resetStore();
  queryClient.clear();
});

afterAll(() => server.close());
