import type { Environment } from 'vitest/environments';
import type { EnvironmentStencil } from './types.js';

// Dynamically import populateGlobal to support both vitest 4.1+ (vitest/runtime) and older versions (vitest/environments)
async function getPopulateGlobal() {
  try {
    // Use variable to prevent Vite's static import analysis from failing on older vitest
    const runtimePath = 'vitest/' + 'runtime';
    return (await import(/* @vite-ignore */ runtimePath)).populateGlobal;
  } catch {
    return (await import('vitest/environments')).populateGlobal;
  }
}
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

    // Stub globals on global before populateGlobal to prevent Node's undici from loading.
    // When populateGlobal accesses these globals, Node lazily loads them from undici,
    // which has a bug in Node 20.x where WebSocket extends undefined EventTarget.
    // By pre-stubbing these with the window's versions, we prevent the undici load.
    const globalsToStub = ['MessageEvent', 'FormData', 'Headers', 'Request', 'Response', 'WebSocket'];
    for (const key of globalsToStub) {
      if (!(global as any)[key] && (win as any)[key]) {
        Object.defineProperty(global, key, {
          value: (win as any)[key],
          writable: true,
          configurable: true,
        });
      }
    }

    // Set NODE_ENV to test if not already set
    if (!win.process?.env) {
      (win as any).process = { env: {} };
    }
    if (!win.process.env.NODE_ENV) {
      win.process.env.NODE_ENV = 'test';
    }

    // Populate global with window properties
    const populateGlobal = await getPopulateGlobal();
    const { keys, originals } = populateGlobal(global, win, {
      bindFunctions: true,
    });

    // Restore Node's native Event constructor (chai needs this)
    // CustomEvent can stay as mock-doc's version since it's needed for event creation
    if (originals.has('Event')) {
      (global as any).Event = originals.get('Event');
    }

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
