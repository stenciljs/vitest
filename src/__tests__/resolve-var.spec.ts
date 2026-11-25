import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inlineImportedResolveVars } from '../resolve-var.js';

let root: string;

function inline(code: string, file: string): string {
  return inlineImportedResolveVars(code, file).code;
}

function write(relPath: string, contents: string): string {
  const absPath = join(root, relPath);
  mkdirSync(join(absPath, '..'), { recursive: true });
  writeFileSync(absPath, contents);
  return absPath;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'resolve-var-test-'));
  write(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        experimentalDecorators: true,
        jsx: 'react',
        jsxFactory: 'h',
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'es2017',
        baseUrl: '.',
        paths: { '@catalog': ['src/catalog/index.ts'] },
      },
      include: ['src'],
    }),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('inlineImportedResolveVars', () => {
  it('leaves source untouched when there is no resolveVar() call', () => {
    const code = `import { Component } from '@stencil/core';\n@Component({ tag: 'my-cmp' }) export class Cmp {}`;
    const file = write('src/cmp.tsx', code);
    expect(inline(code, file)).toBe(code);
  });

  it('leaves same-file constants to the Stencil compiler', () => {
    const code = [
      `import { Component, Event, Listen, resolveVar } from '@stencil/core';`,
      `const MY_EVENT = 'myEvent';`,
      `const EVENTS = { OTHER: 'otherEvent' } as const;`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp {`,
      `  @Event({ eventName: resolveVar(MY_EVENT) }) myEvent;`,
      `  @Listen(resolveVar(EVENTS.OTHER)) onOther() {}`,
      `}`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);
    expect(inline(code, file)).toBe(code);
  });

  it('inlines a nested property of an imported `as const` catalog', () => {
    write(
      'src/events.ts',
      `export const EVENTS = { LOCATION: { CHANGE_EVENT: 'locationChange', CLEAR_EVENT: 'locationClear' } } as const;`,
    );
    const code = [
      `import { Component, Event, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp {`,
      `  @Event({ eventName: resolveVar(EVENTS.LOCATION.CHANGE_EVENT), bubbles: true }) change;`,
      `  @Listen(resolveVar(EVENTS.LOCATION.CLEAR_EVENT))`,
      `  onClear() {}`,
      `}`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    const out = inline(code, file);

    expect(out).toContain(`@Event({ eventName: "locationChange", bubbles: true }) change;`);
    expect(out).toContain(`@Listen("locationClear")`);
    expect(out).not.toContain('resolveVar(');
    // The import itself is preserved for any runtime usage of the catalog.
    expect(out).toContain(`import { EVENTS } from './events';`);
  });

  it('inlines a plain imported string const', () => {
    write('src/events.ts', `export const MY_EVENT = 'myEvent';`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { MY_EVENT } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toContain(`@Listen("myEvent")`);
  });

  it('resolves through a tsconfig `paths` alias and a re-exporting barrel', () => {
    write(
      'src/catalog/base.events.ts',
      `export const BASE_EVENTS = { BUTTON: { CLICK_EVENT: 'buttonClick' } } as const;`,
    );
    write(
      'src/catalog/index.ts',
      [`import { BASE_EVENTS } from './base.events';`, `export const EVENTS = { ...BASE_EVENTS } as const;`].join('\n'),
    );
    const code = [
      `import { Component, Event, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from '@catalog';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Event({ eventName: resolveVar(EVENTS.BUTTON.CLICK_EVENT) }) click; }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toContain(`@Event({ eventName: "buttonClick" }) click;`);
  });

  it('leaves an object catalog without `as const` for Stencil to reject, as `stencil build` does', () => {
    write('src/events.ts', `export const EVENTS = { MY_EVENT: 'myEvent' };`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(EVENTS.MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toBe(code);
  });

  it('falls back to the initializer of a widened variable, as `stencil build` does', () => {
    write('src/events.ts', `export let MY_EVENT = 'myEvent';`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { MY_EVENT } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toContain(`@Listen("myEvent")`);
  });

  it('falls back to the initializer of a static class property, as `stencil build` does', () => {
    write('src/events.ts', `export class Events { static MY_EVENT = 'myEvent'; }`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { Events } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(Events.MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toContain(`@Listen("myEvent")`);
  });

  it('supports namespace imports', () => {
    write('src/events.ts', `export const EVENTS = { MY_EVENT: 'myEvent' } as const;`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import * as catalog from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(catalog.EVENTS.MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toContain(`@Listen("myEvent")`);
  });

  it('leaves calls that do not resolve to a string literal for Stencil to report', () => {
    write('src/events.ts', `export const EVENTS: { MY_EVENT: string } = { MY_EVENT: Math.random().toString() };`);
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(EVENTS.MY_EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    expect(inline(code, file)).toBe(code);
  });

  it('uses the in-memory source rather than what is on disk', () => {
    write('src/events.ts', `export const EVENTS = { A: 'a', B: 'b' } as const;`);
    const onDisk = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from './events';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(EVENTS.A)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', onDisk);
    const inMemory = onDisk.replace('EVENTS.A', 'EVENTS.B');

    expect(inline(inMemory, file)).toContain(`@Listen("b")`);
  });

  it('reports the project files the values came from as dependencies', () => {
    const base = write('src/catalog/base.events.ts', `export const BASE = { CLICK: 'click' } as const;`);
    const barrel = write(
      'src/catalog/index.ts',
      [`import { BASE } from './base.events';`, `export const EVENTS = { ...BASE } as const;`].join('\n'),
    );
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENTS } from '@catalog';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(EVENTS.CLICK)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    const { dependencies } = inlineImportedResolveVars(code, file);
    expect(dependencies).toEqual(expect.arrayContaining([base, barrel]));
    expect(dependencies).not.toContain(file);
    expect(dependencies.some((dep) => dep.includes('/node_modules/'))).toBe(false);
  });

  it('reports no dependencies when nothing is inlined', () => {
    const code = `import { Component } from '@stencil/core';\n@Component({ tag: 'my-cmp' }) export class Cmp {}`;
    const file = write('src/cmp.tsx', code);
    expect(inlineImportedResolveVars(code, file).dependencies).toEqual([]);
  });

  it('resolves components under different tsconfigs independently', () => {
    const component = (pkg: string) => {
      write(
        `${pkg}/tsconfig.json`,
        JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@catalog': ['catalog.ts'] } } }),
      );
      write(`${pkg}/catalog.ts`, `export const EVENT = '${pkg}Event';`);
      const code = [
        `import { Component, Listen, resolveVar } from '@stencil/core';`,
        `import { EVENT } from '@catalog';`,
        `@Component({ tag: 'my-cmp' })`,
        `export class Cmp { @Listen(resolveVar(EVENT)) onIt() {} }`,
      ].join('\n');
      return { code, file: write(`${pkg}/cmp.tsx`, code) };
    };
    const a = component('pkgA');
    const b = component('pkgB');

    for (let i = 0; i < 2; i++) {
      expect(inline(a.code, a.file)).toContain(`@Listen("pkgAEvent")`);
      expect(inline(b.code, b.file)).toContain(`@Listen("pkgBEvent")`);
    }
  });

  it('picks up tsconfig.json changes', () => {
    write('src/catalog/one.ts', `export const EVENT = 'one';`);
    write('src/catalog/two.ts', `export const EVENT = 'two';`);
    const writeConfig = (target: string, mtime: Date) => {
      const config = write(
        'tsconfig.json',
        JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@catalog': [target] } } }),
      );
      utimesSync(config, mtime, mtime);
    };
    const code = [
      `import { Component, Listen, resolveVar } from '@stencil/core';`,
      `import { EVENT } from '@catalog';`,
      `@Component({ tag: 'my-cmp' })`,
      `export class Cmp { @Listen(resolveVar(EVENT)) onIt() {} }`,
    ].join('\n');
    const file = write('src/cmp.tsx', code);

    writeConfig('src/catalog/one.ts', new Date(2000, 0, 1));
    expect(inline(code, file)).toContain(`@Listen("one")`);

    writeConfig('src/catalog/two.ts', new Date(2001, 0, 1));
    expect(inline(code, file)).toContain(`@Listen("two")`);
  });
});
