import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wizard } from '../wizard.js';

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'wizard-test-'));
}

const noCancel = () => false;

function makeSpinner() {
  return { start: vi.fn(), stop: vi.fn() };
}

/**
 * Builds a minimal mock WizardContext. `text`, `select`, and `confirm` are
 * called in the order the wizard invokes them, so their return values must be
 * queued with `.mockResolvedValueOnce(...)` before calling `run`.
 */
function makeInitCtx(
  rootDir: string,
  outputTargets: { type: string; dir?: string; buildDir?: string }[] = [],
  isNewProject = false,
) {
  return {
    config: { rootDir, fsNamespace: 'my-lib', outputTargets },
    isNewProject,
    nypm: { addDependency: vi.fn().mockResolvedValue(undefined) },
    prompts: {
      intro: vi.fn(),
      outro: vi.fn(),
      text: vi.fn(),
      select: vi.fn(),
      confirm: vi.fn(),
      isCancel: noCancel,
      cancel: vi.fn(),
      spinner: vi.fn().mockReturnValue(makeSpinner()),
      log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
    },
  };
}

describe('wizard.generate.fileTemplates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns two default templates when no vitest.config.ts exists', async () => {
    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue(''), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);

    expect(templates).toHaveLength(2);
    expect(templates[0].extension).toBe('spec.tsx');
    expect(templates[0].selectedByDefault).toBe(true);
    expect(templates[1].extension).toBe('browser.spec.ts');
    expect(templates[1].selectedByDefault).toBe(false);
  });

  it('default spec template includes a component import', async () => {
    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue(''), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);
    const content = templates[0].template('my-button');

    expect(content).toContain("import './my-button'");
    expect(content).toContain("describe('my-button'");
    expect(content).toContain('<my-button />');
  });

  it('default browser template has no component import', async () => {
    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue(''), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);
    const content = templates[1].template('my-button');

    expect(content).not.toContain("import './my-button'");
    expect(content).toContain("describe('my-button'");
  });

  it('passes subdirectory to templates', async () => {
    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue('__tests__'), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);

    expect(templates[0].subdirectory).toBe('__tests__');
  });

  it('uses project-based templates when vitest.config.ts has a node project', async () => {
    writeFileSync(
      join(tmpDir, 'vitest.config.ts'),
      `export default {
  test: {
    projects: [
      {
        plugins: [{}],
        test: { name: 'unit', include: ['**/*.spec.{ts,tsx}'] },
      },
    ],
  },
};\n`,
    );

    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue(''), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);

    expect(templates).toHaveLength(1);
    expect(templates[0].extension).toBe('spec.tsx');
    expect(templates[0].label).toContain('Unit');
    expect(templates[0].selectedByDefault).toBe(true);
  });

  it('marks browser project templates as not selected by default', async () => {
    writeFileSync(
      join(tmpDir, 'vitest.config.ts'),
      `export default {
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['**/*.browser.spec.{ts,tsx}'],
          browser: { enabled: true },
        },
      },
    ],
  },
};\n`,
    );

    const ctx = {
      prompts: { text: vi.fn().mockResolvedValue(''), isCancel: noCancel },
      config: { rootDir: tmpDir, fsNamespace: 'my-lib', outputTargets: [] },
    };

    const templates = await wizard.generate!.fileTemplates(ctx as any);

    expect(templates).toHaveLength(1);
    expect(templates[0].selectedByDefault).toBe(false);
  });
});

describe('wizard.init.run', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({ name: 'test-lib', scripts: {} }, null, 2) + '\n');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('cancels when existing config exists and user declines overwrite', async () => {
    writeFileSync(join(tmpDir, 'vitest.config.ts'), 'export default {};\n');

    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.confirm.mockResolvedValueOnce(false); // decline overwrite

    await wizard.init!.run(ctx as any);

    expect(ctx.prompts.cancel).toHaveBeenCalledWith('Skipping Vitest setup - existing config kept.');
    expect(readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8')).toBe('export default {};\n');
  });

  it('proceeds when existing config exists and user accepts overwrite', async () => {
    writeFileSync(join(tmpDir, 'vitest.config.ts'), 'export default {};\n');

    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.confirm
      .mockResolvedValueOnce(true) // accept overwrite
      .mockResolvedValueOnce(false); // don't add another
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');

    await wizard.init!.run(ctx as any);

    expect(ctx.prompts.cancel).not.toHaveBeenCalled();
    const configContent = readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8');
    expect(configContent).toContain("name: 'unit'");
  });

  it('creates vitest.config.ts with stencilVitestPlugin for a node+plugin project', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const config = readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8');
    expect(config).toContain('stencilVitestPlugin()');
    expect(config).toContain("name: 'unit'");
    expect(config).toContain("include: ['**/*.spec.{ts,tsx}']");
    expect(config).not.toContain('setupFiles');
  });

  it('creates vitest.config.ts without plugin for a node+full-build project', async () => {
    const ctx = makeInitCtx(tmpDir, [{ type: 'loader-bundle', dir: join(tmpDir, 'dist/loader-bundle') }]);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('happy-dom')
      .mockResolvedValueOnce('full-build');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const config = readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8');
    expect(config).not.toContain('stencilVitestPlugin');
    expect(config).toContain("setupFiles: ['./vitest-setup.ts']");
    expect(config).toContain("domEnvironment: 'happy-dom'");
  });

  it('creates vitest-setup.ts with loader import for a full-build+loader-bundle project', async () => {
    const ctx = makeInitCtx(tmpDir, [{ type: 'loader-bundle', dir: join(tmpDir, 'dist/loader-bundle') }]);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('mock-doc')
      .mockResolvedValueOnce('full-build');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(existsSync(join(tmpDir, 'vitest-setup.ts'))).toBe(true);
    const setup = readFileSync(join(tmpDir, 'vitest-setup.ts'), 'utf8');
    expect(setup).toContain('my-lib/my-lib.js');
  });

  it('does not overwrite an existing vitest-setup.ts', async () => {
    const originalSetup = "import './existing-loader';\n";
    writeFileSync(join(tmpDir, 'vitest-setup.ts'), originalSetup);

    const ctx = makeInitCtx(tmpDir, [{ type: 'loader-bundle', dir: join(tmpDir, 'dist/loader-bundle') }]);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('mock-doc')
      .mockResolvedValueOnce('full-build');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(readFileSync(join(tmpDir, 'vitest-setup.ts'), 'utf8')).toBe(originalSetup);
  });

  it('installs jsdom for a jsdom node project', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('jsdom').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(ctx.nypm.addDependency).toHaveBeenCalledWith(
      expect.arrayContaining(['vitest', 'jsdom']),
      expect.objectContaining({ dev: true }),
    );
  });

  it('installs playwright packages for a browser+playwright project', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('browser').mockResolvedValueOnce('**/*.browser.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('browser').mockResolvedValueOnce('playwright');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(ctx.nypm.addDependency).toHaveBeenCalledWith(
      expect.arrayContaining(['vitest', '@vitest/browser', '@vitest/browser-playwright', 'playwright']),
      expect.objectContaining({ dev: true }),
    );
  });

  it('installs wdio packages for a browser+webdriverio project', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('browser').mockResolvedValueOnce('**/*.browser.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('browser').mockResolvedValueOnce('wdio');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(ctx.nypm.addDependency).toHaveBeenCalledWith(
      expect.arrayContaining(['vitest', '@vitest/browser', '@vitest/browser-webdriverio']),
      expect.objectContaining({ dev: true }),
    );
    expect(ctx.nypm.addDependency).not.toHaveBeenCalledWith(expect.arrayContaining(['playwright']), expect.anything());
  });

  it('writes test and test:<name> scripts to package.json', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts['test:unit']).toBe('vitest run --project unit');
  });

  it('uses stencil-test script for a full-build project', async () => {
    const ctx = makeInitCtx(tmpDir, [{ type: 'loader-bundle', dir: join(tmpDir, 'dist/loader-bundle') }]);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('mock-doc')
      .mockResolvedValueOnce('full-build');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('stencil-test');
    expect(pkg.scripts['test:unit']).toBe('stencil-test --project unit');
  });

  it('does not overwrite existing package.json test scripts', async () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-lib', scripts: { test: 'my-custom-test' } }, null, 2) + '\n',
    );

    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('my-custom-test');
  });

  it('generates example spec files for components when isNewProject is true', async () => {
    const componentDir = join(tmpDir, 'src', 'components', 'my-button');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(
      join(componentDir, 'my-button.tsx'),
      `import { Component, h } from '@stencil/core';
@Component({ tag: 'my-button', shadow: true })
export class MyButton { render() { return <button />; } }
`,
    );

    const ctx = makeInitCtx(tmpDir, [], true);
    ctx.prompts.text
      .mockResolvedValueOnce('unit') // project name
      .mockResolvedValueOnce('**/*.spec.{ts,tsx}') // pattern
      .mockResolvedValueOnce(''); // subdirectory (empty = co-locate)
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const specFile = join(componentDir, 'my-button.spec.tsx');
    expect(existsSync(specFile)).toBe(true);
    const spec = readFileSync(specFile, 'utf8');
    expect(spec).toContain("describe('my-button'");
    expect(spec).toContain('<my-button />');
  });

  it('generates example spec files into a subdirectory for new projects', async () => {
    const componentDir = join(tmpDir, 'src', 'components', 'my-button');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(
      join(componentDir, 'my-button.tsx'),
      `import { Component, h } from '@stencil/core';
@Component({ tag: 'my-button', shadow: true })
export class MyButton { render() { return <button />; } }
`,
    );

    const ctx = makeInitCtx(tmpDir, [], true);
    ctx.prompts.text
      .mockResolvedValueOnce('unit')
      .mockResolvedValueOnce('**/*.spec.{ts,tsx}')
      .mockResolvedValueOnce('__tests__');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const specFile = join(componentDir, '__tests__', 'my-button.spec.tsx');
    expect(existsSync(specFile)).toBe(true);
  });

  it('skips example test generation when isNewProject is false', async () => {
    const componentDir = join(tmpDir, 'src', 'components', 'my-button');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(
      join(componentDir, 'my-button.tsx'),
      `import { Component, h } from '@stencil/core';
@Component({ tag: 'my-button', shadow: true })
export class MyButton { render() { return <button />; } }
`,
    );

    const ctx = makeInitCtx(tmpDir, [], false);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    expect(existsSync(join(componentDir, 'my-button.spec.tsx'))).toBe(false);
  });

  it('includes stencilConfig option when stencil.config.ts is present', async () => {
    writeFileSync(join(tmpDir, 'stencil.config.ts'), 'export const config = {};\n');

    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text.mockResolvedValueOnce('unit').mockResolvedValueOnce('**/*.spec.{ts,tsx}');
    ctx.prompts.select.mockResolvedValueOnce('node').mockResolvedValueOnce('mock-doc').mockResolvedValueOnce('plugin');
    ctx.prompts.confirm.mockResolvedValueOnce(false);

    await wizard.init!.run(ctx as any);

    const config = readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8');
    expect(config).toContain("stencilConfig: './stencil.config.ts'");
  });

  it('generates correct config for two projects', async () => {
    const ctx = makeInitCtx(tmpDir);
    ctx.prompts.text
      .mockResolvedValueOnce('unit')
      .mockResolvedValueOnce('**/*.spec.{ts,tsx}')
      .mockResolvedValueOnce('browser')
      .mockResolvedValueOnce('**/*.browser.spec.{ts,tsx}');
    ctx.prompts.select
      .mockResolvedValueOnce('node')
      .mockResolvedValueOnce('mock-doc')
      .mockResolvedValueOnce('plugin')
      .mockResolvedValueOnce('browser')
      .mockResolvedValueOnce('playwright');
    ctx.prompts.confirm
      .mockResolvedValueOnce(true) // add another
      .mockResolvedValueOnce(false); // stop

    await wizard.init!.run(ctx as any);

    const config = readFileSync(join(tmpDir, 'vitest.config.ts'), 'utf8');
    expect(config).toContain("name: 'unit'");
    expect(config).toContain("name: 'browser'");
    expect(config).toContain('stencilVitestPlugin()');
    expect(config).toContain('playwright()');
  });
});
