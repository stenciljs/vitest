/**
 * Global variables injected by stencil-test CLI via Vite's define config.
 *
 * Usage in tests:
 * ```typescript
 * if (__STENCIL_PROD__) {
 *   // Running with --prod flag
 * }
 * ```
 *
 * To get TypeScript support, add to your tsconfig.json:
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@stencil/vitest/globals"]
 *   }
 * }
 * ```
 */

declare const __STENCIL_PROD__: boolean;
declare const __STENCIL_SERVE__: boolean;
declare const __STENCIL_PORT__: string;
