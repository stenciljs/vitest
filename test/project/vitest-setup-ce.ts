import { beforeAll } from 'vitest';

if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
  performance.mark('st:app:start');
}

beforeAll(async () => {
  // Load bundled custom elements via autoloader
  await import('./dist/components/loader.js');
});

export {};
