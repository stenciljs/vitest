import type { Environment } from 'vitest/environments';
import { populateGlobal } from 'vitest/environments';
import type { EnvironmentStencil } from './types.js';
import happyDom from './env/happy-dom.js';
import jsdom from './env/jsdom.js';
import mockDoc from './env/mock-doc.js';

export interface StencilEnvironmentOptions {
  /**
   * The DOM environment to use for testing
   * @default 'mock-doc'
   */
  domEnvironment?: 'mock-doc' | 'happy-dom' | 'jsdom';
}

const environmentMap: Record<string, EnvironmentStencil> = {
  'happy-dom': happyDom,
  jsdom: jsdom,
  'mock-doc': mockDoc,
};

/**
 * Custom Vitest environment for Stencil component testing
 *
 * Usage in vitest.config.ts:
 * ```ts
 * export default defineConfig({
 *   test: {
 *     environment: 'stencil',
 *     environmentOptions: {
 *       stencil: {
 *         domEnvironment: 'mock-doc' // or 'happy-dom' or 'jsdom'
 *       }
 *     }
 *   }
 * })
 * ```
 */
export default <Environment>{
  name: 'stencil',
  viteEnvironment: 'ssr',

  async setup(global, options) {
    const { stencil = {} } = options as { stencil?: StencilEnvironmentOptions };
    const domEnvironment = stencil.domEnvironment || 'mock-doc';

    const environment = environmentMap[domEnvironment] || environmentMap['mock-doc'];

    if (!environment) {
      throw new Error(`Unknown domEnvironment: ${domEnvironment}. Must be 'mock-doc', 'happy-dom', or 'jsdom'`);
    }

    // Setup the environment and get the window
    const { window: win, teardown: envTeardown } = await environment(global, options);

    // Stub MessageEvent on global before populateGlobal to prevent Node's undici from loading
    // This prevents "Class extends value undefined" errors from undici's WebSocket implementation
    if (!global.MessageEvent && (win as any).MessageEvent) {
      Object.defineProperty(global, 'MessageEvent', {
        value: (win as any).MessageEvent,
        writable: true,
        configurable: true,
      });
    }

    // Set NODE_ENV to test if not already set
    if (!win.process?.env) {
      (win as any).process = { env: {} };
    }
    if (!win.process.env.NODE_ENV) {
      win.process.env.NODE_ENV = 'test';
    }

    // Populate global with window properties
    const { keys, originals } = populateGlobal(global, win, {
      bindFunctions: true,
    });

    const nativeEventConstructors = ['Event', 'CustomEvent', 'MessageEvent', 'ErrorEvent'];
    nativeEventConstructors.forEach((name) => {
      if (originals.has(name)) {
        (global as any)[name] = originals.get(name);
      }
    });

    // Remove undefined properties that shadow native globals
    keys.forEach((key) => {
      if ((global as any)[key] === undefined && originals.has(key)) {
        (global as any)[key] = originals.get(key);
      }
    });

    return {
      teardown(global) {
        // Teardown the environment first (e.g., window.close())
        // This needs to happen while globals are still populated
        // because disconnectedCallback may use RAF and other polyfills
        envTeardown();

        // Then clean up populated globals
        keys.forEach((key) => delete (global as any)[key]);
        originals.forEach((v, k) => ((global as any)[k] = v));
      },
    };
  },
};
