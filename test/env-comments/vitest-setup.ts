/**
 * Vitest setup for browser environment
 * Extends the base setup and loads Stencil components in the browser
 */

// Load the Stencil components for this project
await import('./dist/test-components-env-comments/test-components-env-comments.esm.js');

export {};
