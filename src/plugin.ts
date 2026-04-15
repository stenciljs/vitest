import { transpile } from '@stencil/core/compiler';
import { existsSync, readFileSync } from 'node:fs';
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
          style: opts.css ? 'inline' : null,
          styleImportData: opts.css ? 'queryparams' : null,
          target: 'es2022',
          // Don't rewrite import paths — let Vite handle resolution via aliases
          transformAliasedImportPaths: false,
        });

        const errors = result.diagnostics?.filter((d) => d.level === 'error') ?? [];
        if (errors.length > 0) {
          const messages = errors.map((d) => d.messageText).join('\n');
          throw new Error(`[stencil-vitest-plugin] Transform error in ${id}:\n${messages}`);
        }

        let transformedCode = result.code;

        // If CSS is enabled, inline the CSS imports as functions, - Stencil v4 always expects css to be a function, Vite
        // tries to handle the import as a string and errors.
        // In v5, Stencil supports both string and function styles, but the plugin opts for function style for consistency across versions.
        if (opts.css) {
          // Match: import SomeVar from "./path.css?tag=...&encapsulation=...";
          const cssImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+\.css\?tag[^'"]+)['"]\s*;?/g;
          let match;

          while ((match = cssImportRegex.exec(result.code)) !== null) {
            const [fullMatch, varName, importPath] = match;
            const [relPath] = importPath.split('?');
            const absolutePath = resolve(dirname(id), relPath);

            if (existsSync(absolutePath)) {
              const css = readFileSync(absolutePath, 'utf-8');
              // Replace the import with an inline function
              const inlineFunc = `const ${varName} = () => ${JSON.stringify(css)};`;
              transformedCode = transformedCode.replace(fullMatch, inlineFunc);
            }
          }
        }

        return {
          code: transformedCode,
        };
      } catch (err) {
        console.error(`[stencil-vitest-plugin] Failed to transform ${id}:`, err);
        throw err;
      }
    },
  };
}
