import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.spec.ts', 'bin/__tests__/**/*.spec.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'bin/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types.ts', 'bin/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@stencil/vitest': './src/index.ts',
    },
  },
});
