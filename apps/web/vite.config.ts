import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: [resolve(rootDir, 'src/test/setup.ts')],
    css: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
