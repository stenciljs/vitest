import type { GenerateContext, ProjectConfig, StencilWizardPlugin, WizardContext } from '@stencil/cli';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

type DomEnvironment = 'mock-doc' | 'jsdom' | 'happy-dom';
type LoadMethod = 'plugin' | 'full-build';
type BrowserProviderName = 'playwright' | 'wdio';
type OutputTarget = 'loader-bundle' | 'standalone';

interface ProjectBase {
  name: string;
  pattern: string;
  loadMethod: LoadMethod;
}

interface NodeProject extends ProjectBase {
  type: 'node';
  env: DomEnvironment;
  outputTarget: OutputTarget | null;
}

interface BrowserProject extends ProjectBase {
  type: 'browser';
  provider: BrowserProviderName;
}

type Project = NodeProject | BrowserProject;

interface ProjectMeta {
  type: 'node' | 'browser';
  name: string;
  pattern: string;
  loadMethod: LoadMethod;
}

/** Reads the existing vitest.config.ts (if any) and extracts project name/pattern/type metadata. */
async function loadVitestProjects(rootDir: string): Promise<ProjectMeta[]> {
  const configPath = join(rootDir, 'vitest.config.ts');
  if (!(await fileExists(configPath))) return [];

  try {
    const { createJiti } = await import('jiti');
    const jiti = createJiti(rootDir, { interopDefault: true, moduleCache: false });
    const mod = (await jiti.import(configPath)) as any;
    const config = await (mod?.default ?? mod);
    const projects: any[] = config?.test?.projects ?? [];

    return projects.flatMap((p: any): ProjectMeta[] => {
      const test = p?.test ?? {};
      const name = test.name as string | undefined;
      const pattern = (test.include as string[] | undefined)?.[0];
      if (!name || !pattern) return [];

      const loadMethod: LoadMethod = Array.isArray(p.plugins) && p.plugins.length > 0 ? 'plugin' : 'full-build';

      if (test.browser?.enabled === true) {
        return [{ type: 'browser' as const, name, pattern, loadMethod }];
      }

      return [{ type: 'node' as const, name, pattern, loadMethod }];
    });
  } catch {
    return [];
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the relative import path for the component loader to use in vitest-setup.ts.
 * Prefers loader-bundle (works in dev + prod); falls back to standalone's dev-mode loader.
 * Returns null if neither output target is configured or the standalone loader is disabled.
 */
function resolveLoaderImport(config: ProjectConfig): string | null {
  type WithDir = { type: string; dir?: string };
  type LoaderBundleOutput = WithDir & { buildDir?: string };
  type StandaloneOutput = WithDir & { autoLoader?: boolean | { fileName?: string } };

  const ns = config.fsNamespace;
  const outputs = config.outputTargets as ReadonlyArray<WithDir>;

  const loaderBundle = outputs.find((o) => o.type === 'loader-bundle') as LoaderBundleOutput | undefined;
  if (loaderBundle) {
    // buildDir resolves to dir by default; the browser CDN build lands at {buildDir}/{namespace}/
    const buildDir = loaderBundle.buildDir ?? loaderBundle.dir ?? 'dist/loader-bundle';
    return `./${relative(config.rootDir, buildDir)}/${ns}/${ns}.js`;
  }

  const standalone = outputs.find((o) => o.type === 'standalone') as StandaloneOutput | undefined;
  if (standalone) {
    if (standalone.autoLoader === false) return null;
    const dir = standalone.dir ?? 'dist/standalone';
    const fileName =
      typeof standalone.autoLoader === 'object' ? (standalone.autoLoader.fileName ?? 'loader') : 'loader';
    return `./${relative(config.rootDir, dir)}/${fileName}.js`;
  }

  return null;
}

/** Checks which distribution output targets are present, to drive the load-method prompt. */
function detectOutputTargets(config: ProjectConfig): { hasLoaderBundle: boolean; hasStandalone: boolean } {
  const outputs = config.outputTargets as ReadonlyArray<{ type: string }>;
  const hasLoaderBundle = outputs.some((o) => o.type === 'loader-bundle' || o.type === 'dist');
  const hasStandalone = outputs.some((o) => o.type === 'standalone' || o.type === 'dist-custom-elements');
  if (!hasLoaderBundle && !hasStandalone) return { hasLoaderBundle: true, hasStandalone: false };
  return { hasLoaderBundle, hasStandalone };
}

function defaultPattern(name: string): string {
  if (name === 'unit') return '**/*.spec.{ts,tsx}';
  return `**/*.${name}.spec.{ts,tsx}`;
}

/** Runs the interactive prompts for a single Vitest project and returns its configuration. */
async function promptProject(
  prompts: WizardContext['prompts'],
  usedPatterns: Set<string>,
  outputTargets: { hasLoaderBundle: boolean; hasStandalone: boolean },
  isFirst: boolean,
): Promise<Project> {
  const { text, select, isCancel, cancel, log } = prompts;

  const rawName = await text({
    message: 'Project name? (label for this group of tests - e.g. unit, browser, jsdom)',
    placeholder: isFirst ? 'unit' : 'e.g. unit, browser, jsdom',
    defaultValue: isFirst ? 'unit' : '',
    validate: (v) => (!v?.trim() && !isFirst ? 'Name is required' : undefined),
  });
  if (isCancel(rawName)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }
  const name = rawName as string;

  const projectType = await select({
    message: 'Node-based or browser-based?',
    options: [
      { value: 'node', label: 'Node', hint: 'unit / component tests - mock or emulated DOM' },
      { value: 'browser', label: 'Browser', hint: 'real Chromium - interactions, screenshots, visual' },
    ],
  });
  if (isCancel(projectType)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }

  const patternDefault = defaultPattern(name);
  const rawPattern = await text({
    message: 'Test file pattern?',
    placeholder: patternDefault,
    defaultValue: patternDefault,
  });
  if (isCancel(rawPattern)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }
  const pattern = rawPattern as string;

  if (usedPatterns.has(pattern)) {
    log.warn(`"${pattern}" is already claimed by another project - files will run in both.`);
  }
  usedPatterns.add(pattern);

  if (projectType === 'browser') {
    const provider = await select({
      message: 'Browser provider?',
      options: [
        { value: 'playwright', label: 'Playwright', hint: 'chromium / firefox / webkit' },
        { value: 'wdio', label: 'WebdriverIO', hint: 'selenium-compatible, more browser variety' },
      ],
    });
    if (isCancel(provider)) {
      cancel('Setup cancelled.');
      process.exit(0);
    }

    const browserLoadMethod = await select({
      message: 'How should components be loaded?',
      options: [
        {
          value: 'plugin',
          label: 'Plugin (source)',
          hint: 'compile on-the-fly via @stencil/unplugin - no dist build required',
        },
        { value: 'full-build', label: 'Full build (dist)', hint: 'test the built loader/standalone bundle' },
      ],
    });
    if (isCancel(browserLoadMethod)) {
      cancel('Setup cancelled.');
      process.exit(0);
    }

    return {
      type: 'browser',
      name,
      pattern,
      provider: provider as BrowserProviderName,
      loadMethod: browserLoadMethod as LoadMethod,
    };
  }

  // Node-based
  const env = await select({
    message: 'DOM environment?',
    options: [
      { value: 'mock-doc', label: 'mock-doc', hint: 'Fastest - Stencil-native' },
      { value: 'jsdom', label: 'jsdom', hint: 'Full DOM emulation' },
      { value: 'happy-dom', label: 'happy-dom', hint: 'Faster than jsdom' },
    ],
  });
  if (isCancel(env)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }

  const loadMethod = await select({
    message: 'How should components be loaded?',
    options: [
      {
        value: 'plugin',
        label: 'Plugin (source)',
        hint: 'compile on-the-fly via @stencil/unplugin - module mocking, accurate coverage',
      },
      { value: 'full-build', label: 'Full build (dist)', hint: 'test the actual output - no module mocking, no coverage' },
    ],
  });
  if (isCancel(loadMethod)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }

  let outputTarget: OutputTarget | null = null;
  if (loadMethod === 'full-build') {
    if (outputTargets.hasLoaderBundle && outputTargets.hasStandalone) {
      const ot = await select({
        message: 'Which output to load from?',
        options: [
          { value: 'loader-bundle', label: 'loader-bundle', hint: 'lazy loader path - defineCustomElements()' },
          { value: 'standalone', label: 'standalone', hint: 'direct imports - components auto-register on import' },
        ],
      });
      if (isCancel(ot)) {
        cancel('Setup cancelled.');
        process.exit(0);
      }
      outputTarget = ot as OutputTarget;
    } else {
      outputTarget = outputTargets.hasStandalone ? 'standalone' : 'loader-bundle';
    }
  }

  return {
    type: 'node',
    name,
    pattern,
    env: env as DomEnvironment,
    loadMethod: loadMethod as LoadMethod,
    outputTarget,
  };
}

/** Returns the set of npm packages that need to be installed for the chosen projects. */
function collectDeps(projects: Project[]): string[] {
  const deps = new Set<string>(['vitest']);
  for (const p of projects) {
    if (p.loadMethod === 'plugin') deps.add('@stencil/unplugin');
    if (p.type === 'node') {
      if (p.env === 'jsdom') deps.add('jsdom');
      if (p.env === 'happy-dom') deps.add('happy-dom');
    } else {
      deps.add('@vitest/browser');
      if (p.provider === 'playwright') {
        deps.add('@vitest/browser-playwright');
        deps.add('playwright');
      } else {
        deps.add('@vitest/browser-webdriverio');
      }
    }
  }
  return [...deps];
}

/** Renders a single Vitest workspace project block for vitest.config.ts. */
function generateProjectBlock(project: Project, excludePatterns: string[]): string {
  const excludeLine =
    excludePatterns.length > 0 ? `\n          exclude: [${excludePatterns.map((p) => `'${p}'`).join(', ')}],` : '';

  const pluginsLine = project.loadMethod === 'plugin' ? '\n        plugins: [stencilVite()],' : '';
  const setupLine = project.loadMethod === 'full-build' ? `\n          setupFiles: ['./vitest-setup.ts'],` : '';

  if (project.type === 'browser') {
    const providerExpr = project.provider === 'playwright' ? 'playwright()' : 'webdriverio()';
    return `      {${pluginsLine}
        test: {
          name: '${project.name}',
          include: ['${project.pattern}'],${excludeLine}${setupLine}
          browser: {
            enabled: true,
            provider: ${providerExpr},
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      }`;
  }

  const envOptions =
    project.env !== 'mock-doc'
      ? `
          environmentOptions: {
            stencil: { domEnvironment: '${project.env}' },
          },`
      : '';

  return `      {${pluginsLine}
        test: {
          name: '${project.name}',
          environment: 'stencil',${envOptions}${setupLine}
          include: ['${project.pattern}'],${excludeLine}
        },
      }`;
}

/** Generates the full vitest.config.ts file content for the chosen set of projects. */
function generateVitestConfig(projects: Project[], hasStencilConfig: boolean): string {
  const needsPlugin = projects.some((p) => p.loadMethod === 'plugin');
  const needsPlaywright = projects.some((p) => p.type === 'browser' && (p as BrowserProject).provider === 'playwright');
  const needsWdio = projects.some((p) => p.type === 'browser' && (p as BrowserProject).provider === 'wdio');

  const imports = [
    `import { defineVitestConfig } from '@stencil/vitest/config';`,
    needsPlugin ? `import { stencilVite } from '@stencil/unplugin';` : null,
    needsPlaywright ? `import { playwright } from '@vitest/browser-playwright';` : null,
    needsWdio ? `import { webdriverio } from '@vitest/browser-webdriverio';` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const stencilConfigOption = hasStencilConfig ? `\n  stencilConfig: './stencil.config.ts',` : '';
  const projectBlocks = projects
    .map((project, i) => {
      const currentBase = parsePattern(project.pattern)?.replace(/[^.]+$/, '');
      const excludePatterns = projects
        .filter((_, j) => j !== i)
        .filter((other) => {
          if (!currentBase) return false;
          const otherBase = parsePattern(other.pattern)?.replace(/[^.]+$/, '');
          return !!otherBase && otherBase.endsWith(currentBase);
        })
        .map((p) => p.pattern);
      return generateProjectBlock(project, excludePatterns);
    })
    .join(',\n');

  return `${imports}

export default defineVitestConfig({${stencilConfigOption}
  test: {
    projects: [
${projectBlocks},
    ],
  },
});
`;
}

function specTemplate(tagName: string, importComponent = false): string {
  const componentImport = importComponent ? `import './${tagName}';\n` : '';
  return `import { describe, it, expect, render } from '@stencil/vitest';
${componentImport}
describe('${tagName}', () => {
  it('renders', async () => {
    const { root } = await render(<${tagName} />);
    expect(root).toBeDefined();
  });
});
`;
}

// Returns the file suffix for a pattern like **/*.browser.spec.{ts,tsx},
// preferring tsx when available. Returns null for patterns that can't be
// reduced to a simple **/* glob (e.g. tests/**/*.spec.ts).
function parsePattern(pattern: string): string | null {
  const match = pattern.match(/^\*\*\/\*([^{*]+)(?:\{([^}]+)\})?$/);
  if (!match) return null;
  const base = match[1];
  const exts = match[2];
  if (!exts) return base;
  const extList = exts.split(',').map((e) => e.trim());
  return base + (extList.includes('tsx') ? 'tsx' : extList[0]);
}

/** Writes a starter spec file alongside each existing component for new projects. */
async function generateExampleTests(rootDir: string, projects: Project[]): Promise<void> {
  const componentsDir = join(rootDir, 'src', 'components');
  const entries = await readdir(componentsDir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const componentFile = join(componentsDir, entry.name, `${entry.name}.tsx`);
    if (!(await fileExists(componentFile))) continue;

    const source = await readFile(componentFile, 'utf8');
    if (!source.includes('@Component')) continue;

    const tagMatch = source.match(/tag:\s*['"]([^'"]+)['"]/);
    const tagName = tagMatch?.[1] ?? entry.name;

    for (const project of projects) {
      const suffix = parsePattern(project.pattern);
      if (!suffix) continue;

      const specFile = join(componentsDir, entry.name, `${tagName}${suffix}`);
      if (await fileExists(specFile)) continue;

      const content = specTemplate(tagName, project.loadMethod === 'plugin');
      await writeFile(specFile, content, 'utf8');
    }
  }
}

function needsBuild(project: Project): boolean {
  return project.loadMethod === 'full-build';
}

/** Adds `test` and `test:<name>` scripts to package.json if they don't already exist. */
async function updatePackageJsonScripts(rootDir: string, projects: Project[]): Promise<void> {
  const pkgPath = join(rootDir, 'package.json');
  const content = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(content) as Record<string, any>;

  pkg['scripts'] ??= {};

  const anyFullBuild = projects.some(needsBuild);
  if (!pkg['scripts']['test']) pkg['scripts']['test'] = anyFullBuild ? 'stencil-test' : 'vitest run';

  for (const p of projects) {
    const key = `test:${p.name}`;
    const cmd = needsBuild(p) ? `stencil-test --project ${p.name}` : `vitest run --project ${p.name}`;
    if (!pkg['scripts'][key]) pkg['scripts'][key] = cmd;
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

export const wizard: StencilWizardPlugin = {
  init: {
    id: '@stencil/vitest',
    displayName: 'Vitest',
    description: 'Unit + component testing',

    async run({ config, isNewProject, prompts, nypm }: WizardContext): Promise<void> {
      const { intro, outro, confirm, isCancel, cancel, spinner } = prompts;
      const rootDir = config.rootDir;

      intro('Vitest - unit + component testing for Stencil');

      const vitestConfigPath = join(rootDir, 'vitest.config.ts');

      if (!isNewProject && (await fileExists(vitestConfigPath))) {
        const overwrite = await confirm({
          message: 'vitest.config.ts already exists. Overwrite it?',
          initialValue: false,
        });
        if (isCancel(overwrite) || !overwrite) {
          cancel('Skipping Vitest setup - existing config kept.');
          return;
        }
      }

      const outputTargets = detectOutputTargets(config);
      const hasStencilConfig = await fileExists(join(rootDir, 'stencil.config.ts'));

      const projects: Project[] = [];
      const usedPatterns = new Set<string>();
      let isFirst = true;

      let keepAdding = true;
      while (keepAdding) {
        const project = await promptProject(prompts, usedPatterns, outputTargets, isFirst);
        projects.push(project);
        isFirst = false;

        const addAnother = await confirm({ message: 'Add another project?', initialValue: false });
        keepAdding = !isCancel(addAnother) && (addAnother as boolean);
      }

      const deps = collectDeps(projects);
      if (deps.length > 0) {
        const s = spinner();
        s.start('Installing dependencies');
        await nypm.addDependency(deps, { cwd: rootDir, dev: true });
        s.stop('Dependencies installed');
      }

      const needsSetupFile = projects.some((p) => p.loadMethod === 'full-build');
      if (needsSetupFile) {
        const setupPath = join(rootDir, 'vitest-setup.ts');
        if (!(await fileExists(setupPath))) {
          const loaderImport = resolveLoaderImport(config);
          if (loaderImport === null) {
            prompts.log.warn(
              'Could not determine a loader path — no loader-bundle or standalone output target found.\n' +
                'Create vitest-setup.ts manually and import your component loader.',
            );
          } else {
            await writeFile(setupPath, `import '${loaderImport}';\n`, 'utf8');
          }
        }
      }

      await writeFile(vitestConfigPath, generateVitestConfig(projects, hasStencilConfig), 'utf8');
      await updatePackageJsonScripts(rootDir, projects);

      if (isNewProject) {
        await generateExampleTests(rootDir, projects);
      }

      outro('Vitest configured');
    },
  },

  generate: {
    fileTemplates: async (ctx: GenerateContext) => {
      const { config } = ctx;
      const projects = await loadVitestProjects(config.rootDir);

      if (projects.length === 0) {
        return [
          {
            label: 'Spec test (.spec.tsx)',
            extension: 'spec.tsx',
            selectedByDefault: true,
            template: (tagName: string) => specTemplate(tagName, true),
          },
          {
            label: 'Browser test (.browser.spec.ts)',
            extension: 'browser.spec.ts',
            selectedByDefault: false,
            template: (tagName: string) => specTemplate(tagName, false),
          },
        ];
      }

      return projects.flatMap((project) => {
        const suffix = parsePattern(project.pattern);
        if (!suffix) return [];
        const ext = suffix.replace(/^\./, '');
        const label = `${project.name[0].toUpperCase()}${project.name.slice(1)} (${ext})`;
        return [
          {
            label,
            extension: ext,
            selectedByDefault: project.type === 'node',
            template: (tagName: string) => specTemplate(tagName, project.loadMethod === 'plugin'),
          },
        ];
      });
    },
  },
};
