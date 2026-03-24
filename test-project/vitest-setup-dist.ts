import { beforeAll } from 'vitest';

beforeAll(async () => {
  // Load the lazy-loader for this project
  await import('./dist/test-components/test-components.esm.js');
});


export {};
