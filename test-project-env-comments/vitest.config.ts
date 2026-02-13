import { defineVitestConfig } from '@stencil/vitest/config';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
});
