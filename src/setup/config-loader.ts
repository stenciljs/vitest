import type { Config as StencilConfig, HydratedFlag } from '@stencil/core/internal';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Load Stencil configuration from a file path
 * Uses jiti to handle TypeScript files in Node.js
 */
export async function loadStencilConfig(configPath: string): Promise<StencilConfig | undefined> {
  const resolvedPath = resolve(process.cwd(), configPath);

  if (!existsSync(resolvedPath)) {
    console.warn(`Stencil config not found at ${resolvedPath}`);
    return undefined;
  }

  try {
    // Use jiti for loading TypeScript configs in Node.js
    const { createJiti } = await import('jiti');
    const jiti = createJiti(process.cwd(), {
      interopDefault: true,
      moduleCache: false,
    });

    const configModule = (await jiti.import(resolvedPath)) as any;
    return configModule.config || configModule.default || configModule;
  } catch (error) {
    console.error(`Failed to load Stencil config from ${resolvedPath}:`, error);
    return undefined;
  }
}

/**
 * Get the source directory from Stencil config
 */
export function getStencilSrcDir(config?: StencilConfig): string {
  return config?.srcDir || 'src';
}

/**
 * Get all output directories from Stencil config for exclusion
 */
export function getStencilOutputDirs(config?: StencilConfig): string[] {
  if (!config?.outputTargets) {
    return ['dist', 'www', 'build', '.stencil'];
  }

  const outputDirs = new Set<string>();

  config.outputTargets.forEach((target: any) => {
    // Add common output directories based on target type
    if (target.dir) {
      outputDirs.add(target.dir);
    }
    if (target.buildDir) {
      outputDirs.add(target.buildDir);
    }

    // Handle Stencil default directories for output types that don't specify dir
    // Based on Stencil's default behavior:
    if (target.type === 'dist' || target.type === 'dist-custom-elements' || target.type === 'dist-hydrate-script') {
      // These all default to 'dist' directory
      if (!target.dir && !target.buildDir) {
        outputDirs.add('dist');
      }
    }
    if (target.type === 'www') {
      // www defaults to 'www' directory
      if (!target.dir && !target.buildDir) {
        outputDirs.add('www');
      }
    }
    // Note: esmLoaderPath is a relative import path like '../loader', not a directory
    // We should NOT extract this as an exclude pattern
  });

  // Always include common output directories
  outputDirs.add('.stencil');

  // Filter out invalid paths (those that navigate up with ..)
  const validDirs = Array.from(outputDirs).filter((dir) => !dir.includes('..'));

  return validDirs.length > 0 ? validDirs : ['dist', 'www', 'build', '.stencil'];
}

/**
 * Get the hydrated flag configuration from Stencil config.
 * Returns null if hydration indication is explicitly disabled.
 * Returns defaults if not configured.
 */
export function getStencilHydratedFlag(config?: StencilConfig): HydratedFlag | null {
  // If explicitly null, hydration indication is disabled
  if (config?.hydratedFlag === null) {
    return null;
  }
  // If undefined or object, return with defaults applied
  const flag = config?.hydratedFlag;
  return {
    name: flag?.name ?? 'hydrated',
    selector: flag?.selector ?? 'class',
    property: flag?.property ?? 'visibility',
    initialValue: flag?.initialValue ?? 'hidden',
    hydratedValue: flag?.hydratedValue ?? 'inherit',
  };
}

/**
 * Create resolve aliases from Stencil config
 */
export function getStencilResolveAliases(config?: StencilConfig): Record<string, string> {
  const srcDir = getStencilSrcDir(config);
  const aliases: Record<string, string> = {
    '@': resolve(process.cwd(), srcDir),
  };

  // Add component alias if components directory exists
  const componentsDir = resolve(process.cwd(), srcDir, 'components');
  if (existsSync(componentsDir)) {
    aliases['@components'] = componentsDir;
  }

  // Add utils alias if utils directory exists
  const utilsDir = resolve(process.cwd(), srcDir, 'utils');
  if (existsSync(utilsDir)) {
    aliases['@utils'] = utilsDir;
  }

  return aliases;
}
