import { fileURLToPath } from 'node:url';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import {
  loadStencilConfig,
  getStencilSrcDir,
  getStencilOutputDirs,
  getStencilResolveAliases,
} from './setup/config-loader.js';
import type { Config as StencilConfig } from '@stencil/core/internal';

// Resolve the path to the stencil environment module at config load time
// This is necessary for pnpm which doesn't hoist transitive dependencies
const stencilEnvironmentPath = fileURLToPath(import.meta.resolve('@stencil/vitest/environments/stencil'));

/**
 * Define a Vitest configuration for Stencil component testing
 *
 * Accepts standard Vitest config with optional Stencil enhancements.
 * Automatically applies Stencil-specific defaults:
 * - JSX configuration (h, Fragment)
 * - Resolve aliases from Stencil config (@, @components, @utils)
 * - Coverage configuration based on srcDir
 * - Exclude patterns for build outputs
 * - Auto-injects jsdom-setup for environment: 'jsdom'
 * - Auto-injects happy-dom-setup for environment: 'happy-dom'
 * - Custom 'stencil' environment handles its own setup
 *
 * @example
 * ```ts
 * import { defineVitestConfig } from '@stencil/vitest/config';
 *
 * export default defineVitestConfig({
 *   test: {
 *     projects: [
 *       {
 *         test: {
 *           name: 'stencil',
 *           include: ['**\/*.spec.tsx'],
 *           environment: 'stencil',
 *           setupFiles: ['./vitest-setup.ts'],
 *          // environmentOptions: {
 *          //   stencil: {
 *          //     domEnvironment: 'happy-dom' // 'jsdom' | 'mock-doc' (default), Make sure to install relevant packages
 *          //   },
 *          // },
 *         },
 *       },
 *       {
 *         test: {
 *           name: 'jsdom',
 *           include: ['**\/*.jsdom.spec.tsx'],
 *           environment: 'jsdom',
 *           setupFiles: ['./vitest-setup.ts'],
 *         },
 *       },
 *       {
 *         test: {
 *           name: 'happy-dom',
 *           include: ['**\/*.happy.spec.tsx'],
 *           environment: 'happy-dom',
 *           setupFiles: ['./vitest-setup.ts'],
 *         },
 *       },
 *       {
 *         test: {
 *           name: 'browser',
 *           include: ['**\/*.e2e.tsx'],
 *           browser: {
 *             enabled: true,
 *             provider: 'playwright',
 *             instances: [
 *               { browser: 'chromium' }
 *             ],
 *           },
 *         },
 *       },
 *     ],
 *   },
 * });
 * ```
 */
export async function defineVitestConfig(
  config: ViteUserConfig & { stencilConfig?: string | StencilConfig } = {},
): Promise<ViteUserConfig> {
  // Load Stencil config if provided (optional)
  let stencilConfig: StencilConfig | undefined;

  if (typeof config.stencilConfig === 'string') {
    try {
      stencilConfig = await loadStencilConfig(config.stencilConfig);
    } catch {
      // loading is optional
    }
  } else if (config.stencilConfig) {
    stencilConfig = config.stencilConfig;
  }

  // Remove stencilConfig from the final config (destructure to exclude it)
  const { stencilConfig: _stencilConfig, ...vitestConfig } = config;

  // Apply Stencil-specific defaults
  const enhancedConfig = applyStencilDefaults(vitestConfig, stencilConfig);

  return defineConfig(enhancedConfig);
}

/**
 * Generate coverage exclude patterns from test include patterns
 */
function generateCoverageExcludes(testIncludes: string[], srcDir: string): string[] {
  const excludes: string[] = [];

  for (const include of testIncludes) {
    // Convert test include patterns to coverage exclude patterns
    // Examples:
    // "src/**/*.spec.{ts,tsx}" -> "src/**/*.spec.{ts,tsx}"
    // "**/*.spec.{ts,tsx}" -> "src/**/*.spec.{ts,tsx}" (assuming srcDir is "src")
    // "components/**/*.test.tsx" -> "src/components/**/*.test.tsx"

    let excludePattern = include;

    // If pattern doesn't start with srcDir, prepend it
    if (!excludePattern.startsWith(`${srcDir}/`)) {
      // Handle patterns that start with **/ by replacing with srcDir
      if (excludePattern.startsWith('**/')) {
        excludePattern = excludePattern.replace('**/', `${srcDir}/`);
      } else {
        // For other patterns, prepend srcDir
        excludePattern = `${srcDir}/${excludePattern}`;
      }
    }

    excludes.push(excludePattern);
  }

  return excludes;
}

/**
 * Apply Stencil-specific defaults to Vitest config
 */
function applyStencilDefaults(config: ViteUserConfig, stencilConfig?: StencilConfig): ViteUserConfig {
  // Start with the user's config
  const result = { ...config };

  // Add esbuild JSX config if not present
  if (!result.esbuild) {
    result.esbuild = {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    };
  }

  // Add resolve aliases from Stencil config if not present
  if (!result.resolve) {
    result.resolve = {};
  }

  // Always add alias for vitest-environment-stencil to resolve from this package
  // This is necessary for pnpm which doesn't hoist transitive dependencies
  const environmentAlias = {
    'vitest-environment-stencil': stencilEnvironmentPath,
  };

  if (!result.resolve.alias) {
    result.resolve.alias = {
      ...environmentAlias,
      ...getStencilResolveAliases(stencilConfig),
    };
  } else if (typeof result.resolve.alias === 'object' && !Array.isArray(result.resolve.alias)) {
    // Merge with existing aliases, user's aliases take precedence
    result.resolve.alias = {
      ...environmentAlias,
      ...getStencilResolveAliases(stencilConfig),
      ...result.resolve.alias,
    };
  }

  // Configure Vite server to watch Stencil output directories
  // This allows Vitest to automatically re-run tests when Stencil rebuilds components
  if (!result.server) {
    result.server = {};
  }
  if (!result.server.watch) {
    result.server.watch = {};
  }

  // Ignore source map files to prevent unnecessary test re-runs
  // Stencil may touch .map files without changing content, triggering Vite's watcher
  if (!result.server.watch.ignored) {
    result.server.watch.ignored = [];
  }
  const ignoredArray = Array.isArray(result.server.watch.ignored)
    ? result.server.watch.ignored
    : [result.server.watch.ignored];
  const mapIgnorePatterns = ['**/*.map', '**/*.map.js'];
  result.server.watch.ignored = [...new Set([...ignoredArray, ...mapIgnorePatterns])];

  // Ensure test config exists
  if (!result.test) {
    result.test = {};
  }

  // Inline vitest-environment-stencil so it resolves from this package's node_modules
  // This is necessary for pnpm which doesn't hoist transitive dependencies
  if (!result.test.server) {
    result.test.server = {};
  }
  if (!result.test.server.deps) {
    result.test.server.deps = {};
  }
  if (!result.test.server.deps.inline) {
    result.test.server.deps.inline = [];
  }
  if (Array.isArray(result.test.server.deps.inline)) {
    if (!result.test.server.deps.inline.includes('vitest-environment-stencil')) {
      result.test.server.deps.inline.push('vitest-environment-stencil');
    }
    if (!result.test.server.deps.inline.includes('@stencil/vitest')) {
      result.test.server.deps.inline.push('@stencil/vitest');
    }
  }

  // Enable forceRerunTriggers to watch output directories
  // This ensures Vitest re-runs tests when Stencil rebuilds components
  const outputDirs = getStencilOutputDirs(stencilConfig);
  if (!result.test.forceRerunTriggers) {
    result.test.forceRerunTriggers = [];
  }
  // Add output directories to force rerun triggers
  const existingTriggers = Array.isArray(result.test.forceRerunTriggers)
    ? result.test.forceRerunTriggers
    : [result.test.forceRerunTriggers];
  const outputDirTriggers = outputDirs.map((dir) => `**/${dir}/**`);
  result.test.forceRerunTriggers = [...new Set([...existingTriggers, ...outputDirTriggers])];

  // Add globals if not set
  if (result.test.globals === undefined) {
    result.test.globals = true;
  }

  // Add coverage config at root level if not present
  // This applies to all projects in multi-project mode
  if (!result.test.coverage) {
    const srcDir = getStencilSrcDir(stencilConfig);
    const outputDirs = getStencilOutputDirs(stencilConfig);

    // Collect all test include patterns from projects
    const testIncludes: string[] = [];
    if (result.test.projects) {
      // Multi-project mode
      for (const project of result.test.projects as any[]) {
        if (project.test?.include) {
          const includes = Array.isArray(project.test.include) ? project.test.include : [project.test.include];
          testIncludes.push(...includes);
        }
      }
    } else if (result.test.include) {
      // Single project mode
      const includes = Array.isArray(result.test.include) ? result.test.include : [result.test.include];
      testIncludes.push(...includes);
    }

    // Generate coverage excludes from test includes
    const coverageExcludes =
      testIncludes.length > 0
        ? generateCoverageExcludes(testIncludes, srcDir)
        : [`${srcDir}/**/*.spec.{ts,tsx}`, `${srcDir}/**/*.e2e.{ts,tsx}`, `${srcDir}/**/*.test.{ts,tsx}`];

    result.test.coverage = {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [`${srcDir}/**/*.{ts,tsx}`],
      exclude: [...coverageExcludes, ...outputDirs.map((dir) => `${dir}/**`)],
    };
  }

  // If there are projects, enhance each one
  if (result.test.projects) {
    result.test.projects = (result.test.projects as any[]).map((project) => enhanceProject(project, stencilConfig));
  } else {
    // Single project mode - enhance the test config directly
    result.test = enhanceTestConfig(result.test, stencilConfig);
  }

  if (result.test.onConsoleLog === undefined) {
    result.test.onConsoleLog = (log) => {
      if (log?.includes('Running in development mode.')) return false;
      return true;
    };
  }

  return result;
}

/**
 * Enhance test config with Stencil defaults
 */
function enhanceTestConfig(testConfig: any, stencilConfig?: StencilConfig): any {
  const enhanced = { ...testConfig };

  // Rewrite 'stencil' environment to use the actual path
  // This is necessary for pnpm which doesn't hoist transitive dependencies
  if (enhanced.environment?.toLowerCase() === 'stencil') {
    enhanced.environment = stencilEnvironmentPath;
  }

  // Get output directories from Stencil config
  const outputDirs = getStencilOutputDirs(stencilConfig);
  const defaultExcludes = ['**/node_modules/**', ...outputDirs.map((dir) => `**/${dir}/**`)];

  // Add default excludes if not present
  if (!enhanced.exclude) {
    enhanced.exclude = defaultExcludes;
  } else {
    // Merge with existing excludes
    const existingExcludes = Array.isArray(enhanced.exclude) ? enhanced.exclude : [enhanced.exclude];

    enhanced.exclude = [
      ...defaultExcludes,
      ...existingExcludes.filter((pattern) => !defaultExcludes.includes(pattern)),
    ];
  }

  // Add coverage config based on Stencil srcDir if not present
  if (!enhanced.coverage) {
    const srcDir = getStencilSrcDir(stencilConfig);
    enhanced.coverage = {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [`${srcDir}/**/*.{ts,tsx}`],
      exclude: [
        `${srcDir}/**/*.spec.{ts,tsx}`,
        `${srcDir}/**/*.e2e.{ts,tsx}`,
        `${srcDir}/**/*.test.{ts,tsx}`,
        ...outputDirs.map((dir) => `${dir}/**`),
      ],
    };
  }

  return enhanced;
}

/**
 * Enhance a single project with Stencil defaults
 */
function enhanceProject(project: any, stencilConfig?: StencilConfig): any {
  const enhanced = { ...project };

  // Get output directories from Stencil config
  const outputDirs = getStencilOutputDirs(stencilConfig);
  const defaultExcludes = ['**/node_modules/**', ...outputDirs.map((dir) => `**/${dir}/**`)];

  // Merge default excludes with user-provided excludes
  if (enhanced.test) {
    if (!enhanced.test.exclude) {
      enhanced.test.exclude = defaultExcludes;
    } else {
      // Merge defaults with existing excludes, avoiding duplicates
      const existingExcludes = Array.isArray(enhanced.test.exclude) ? enhanced.test.exclude : [enhanced.test.exclude];

      enhanced.test.exclude = [
        ...defaultExcludes,
        ...existingExcludes.filter((pattern) => !defaultExcludes.includes(pattern)),
      ];
    }

    // Rewrite 'stencil' environment to use the actual path
    // This is necessary for pnpm which doesn't hoist transitive dependencies
    const environment = enhanced.test.environment?.toLowerCase();
    if (environment === 'stencil') {
      enhanced.test.environment = stencilEnvironmentPath;
    }

    // Auto-inject setup files based on environment
    const setupFiles = enhanced.test.setupFiles || [];
    const setupFilesArray = Array.isArray(setupFiles) ? setupFiles : [setupFiles];

    // Auto-inject setup files based on environment type
    // This provides automatic polyfills based on the environment being used

    // Auto-inject jsdom-setup for jsdom environment
    if (environment === 'jsdom') {
      if (!setupFilesArray.includes('@stencil/vitest/jsdom-setup')) {
        enhanced.test.setupFiles = ['@stencil/vitest/jsdom-setup', ...setupFilesArray];
      }
    }

    // Auto-inject happy-dom-setup for happy-dom environment
    if (environment === 'happy-dom') {
      if (!setupFilesArray.includes('@stencil/vitest/happy-dom-setup')) {
        enhanced.test.setupFiles = ['@stencil/vitest/happy-dom-setup', ...setupFilesArray];
      }
    }

    // Note: The 'stencil' custom environment handles its own setup internally
    // and doesn't need auto-injection

    // Note: coverage config is applied at the root test level, not per-project
  }

  return enhanced;
}
