import { transpile } from '@stencil/core/compiler';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
 * @param opts Optional configuration for the plugin
 * @returns a Vite plugin configuration object
 */
export function stencilVitestPlugin(opts: { css?: boolean } = {}): Plugin {
  return {
    name: 'stencil-vitest-transform',
    enforce: 'pre',

    resolveId(id, importer) {
      if (id.includes('.css') && id.includes('tag=')) {
        const [relPath] = id.split('?');
        const query = id.slice(id.indexOf('?'));
        // Strip virtual prefix from importer if present
        const realImporter = importer?.startsWith('\0stencil-style:')
          ? importer.slice('\0stencil-style:'.length).split('?')[0] + '.css'
          : importer!;
        const resolved = resolve(dirname(realImporter), relPath);
        // Remove .css from virtual ID to prevent Vite's CSS plugin from hijacking the output
        return '\0stencil-style:' + resolved.replace(/\.css$/, '') + query;
      }
      return null;
    },

    load(id) {
      if (id.startsWith('\0stencil-style:')) {
        // Add .css back to get the real file path
        const realPath = id.slice('\0stencil-style:'.length).split('?')[0] + '.css';
        return readFileSync(realPath, 'utf-8');
      }
      return null;
    },

    async transform(code, id) {
      if (id.startsWith('\0stencil-style:')) {
        // Reconstruct the original .css path for Stencil's transpiler (it uses extension to detect file type)
        const pathWithoutPrefix = id.slice('\0stencil-style:'.length);
        const [basePath, query] = pathWithoutPrefix.split('?');
        const originalPath = basePath + '.css' + (query ? '?' + query : '');
        const result = await transpile(code, { file: originalPath });
        return {
          code: result.code,
          map: null,
        };
      }

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

      try {
        const result = await transpile(code, {
          file: id,
          // 'customelement' appends a customElements.define() call so the component
          // self-registers the moment this module is imported — no loader needed.
          componentExport: 'customelement',
          componentMetadata: 'compilerstatic',
          currentDirectory: process.cwd(),
          module: 'esm',
          proxy: null,
          sourceMap: false,
          style: opts.css ? 'static' : null,
          styleImportData: opts.css ? 'queryparams' : null,
          target: 'es2017',
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
      } catch (err) {
        console.error(`[stencil-vitest-plugin] Failed to transform ${id}:`, err);
        throw err;
      }
    },
  };
}
