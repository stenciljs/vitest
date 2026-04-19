/**
 * Setup for mock-doc environment
 * This file is automatically loaded when using the mock-doc environment in Node.js
 *
 * IMPORTANT: This should only be imported/executed in Node.js runtime, not in browsers.
 * The projects-based config ensures this is only loaded for node:mock-doc projects.
 */
import { MockWindow, setupGlobal, teardownGlobal } from '@stencil/core/mock-doc';

/**
 * Apply polyfills to a window object for Stencil components
 * This function is reused by both the setup file and the custom environment
 */
export function applyMockDocPolyfills(win: any) {
  // Set baseURI manually
  Object.defineProperty(win.document, 'baseURI', {
    value: 'http://localhost:3000/',
    writable: false,
    configurable: true,
  });

  // Setup global with mock-doc globals
  setupGlobal(win);

  // Add MessageEvent if it doesn't exist (needed by Node's undici)
  if (!win.MessageEvent) {
    win.MessageEvent = class MessageEvent extends win.Event {
      constructor(type: string, eventInitDict?: any) {
        super(type, eventInitDict);
      }
    };
  }

  // Add AbortController if it doesn't exist
  if (!win.AbortController) {
    win.AbortController = class AbortController {
      signal: any;
      constructor() {
        this.signal = {
          aborted: false,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        };
      }
      abort() {
        this.signal.aborted = true;
      }
    };
  }

  // Add requestAnimationFrame and related APIs
  win.requestAnimationFrame = (cb: any) => {
    return setTimeout(cb, 0) as any;
  };
  win.cancelAnimationFrame = (id: any) => {
    clearTimeout(id);
  };
  win.requestIdleCallback = (cb: any) => {
    return setTimeout(cb, 0) as any;
  };
  win.cancelIdleCallback = (id: any) => {
    clearTimeout(id);
  };
}

// Only setup mock-doc if we're actually in Node.js (not a real browser)
// Check for Node.js-specific globals that don't exist in browsers
const isNodeEnvironment =
  typeof process !== 'undefined' && process?.versions?.node !== undefined && typeof window === 'undefined';

let win: any;
let doc: any;

if (!isNodeEnvironment) {
  // We're in a real browser, skip mock-doc setup and export real globals
  win = typeof window !== 'undefined' ? window : undefined;
  doc = typeof document !== 'undefined' ? document : undefined;
} else {
  // We're in Node.js, setup mock-doc
  // Create mock window with URL
  win = new MockWindow('http://localhost:3000/');
  doc = win.document;

  // Apply polyfills
  applyMockDocPolyfills(win);

  // Assign to globalThis
  globalThis.window = win as any;
  globalThis.document = doc as any;
  globalThis.HTMLElement = win.HTMLElement as any;
  globalThis.CustomEvent = win.CustomEvent as any;
  globalThis.Event = win.Event as any;
  globalThis.Element = win.Element as any;
  globalThis.Node = win.Node as any;
  globalThis.DocumentFragment = win.DocumentFragment as any;
  globalThis.requestAnimationFrame = win.requestAnimationFrame;
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame;
}

// Export the mock window for use in custom setup
export { win, doc, setupGlobal, teardownGlobal };
