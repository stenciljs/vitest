import type { Plugin } from 'vitest/config';

/**
 * A Vite/Vitest plugin that transforms Stencil component source files (.tsx) on-the-fly,
 * enabling module mocking and direct source imports during tests.
 *
 * The compiled output uses `componentExport: 'customelement'`, which appends a
 * `customElements.define()` call at the end of the transformed file. The component
 * registers itself the moment the module is imported — no dist loader or setup file
 * required. Works with `@stencil/core` v4 and v5.
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * import { defineVitestConfig } from '@stencil/vitest/config';
 * import { stencilVitestPlugin } from '@stencil/vitest/plugin';
 *
 * export default defineVitestConfig({
 *   plugins: [stencilVitestPlugin()],
 *   test: {
 *     projects: [
 *       {
 *         test: {
 *           name: 'stencil',
 *           environment: 'stencil',
 *           include: ['**\/*.spec.tsx'],
 *           // No dist loader needed — import components from source directly
 *         },
 *       },
 *     ],
 *   },
 * });
 * ```
 *
 * @returns a Vite plugin configuration object
 */
export function stencilVitestPlugin(): Plugin {
  return {
    name: 'stencil-vitest-transform',
    enforce: 'pre',

    async transform(code, id) {
      // Only transform .tsx files
      if (!id.endsWith('.tsx')) {
        return null;
      }

      // Quick check for Stencil decorator patterns before paying the compiler cost
      const hasStencilDecorator =
        code.includes('@Component') ||
        code.includes('@Prop') ||
        code.includes('@State') ||
        code.includes('@Event') ||
        code.includes('@Method') ||
        code.includes('@Watch') ||
        code.includes('@Listen');

      if (!hasStencilDecorator) {
        return null;
      }

      const { transpileSync } = await import('@stencil/core/compiler');

      const result = transpileSync(code, {
        file: id,
        // 'customelement' appends a customElements.define() call so the component
        // self-registers the moment this module is imported — no loader needed.
        componentExport: 'customelement',
        componentMetadata: 'compilerstatic',
        currentDirectory: process.cwd(),
        module: 'esm',
        proxy: null,
        sourceMap: false,
        style: 'static',
        styleImportData: 'queryparams',
        target: 'es2022',
        // Don't rewrite import paths — let Vite handle resolution via aliases
        transformAliasedImportPaths: false,
      });

      const errors = result.diagnostics?.filter((d) => d.level === 'error') ?? [];
      if (errors.length > 0) {
        const messages = errors.map((d) => d.messageText).join('\n');
        throw new Error(`[stencil-vitest-plugin] Transform error in ${id}:\n${messages}`);
      }

      return {
        code: result.code,
      };
    },
  };
}
