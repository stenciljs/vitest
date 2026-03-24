import { beforeEach } from 'vitest';
/**
 * Vitest setup for browser environment
 * Extends the base setup and loads Stencil components in the browser
 */

beforeEach(async () => {
  // Load the Stencil components for this project
  await import('./dist/test-components/test-components.esm.js');
});


export {};
