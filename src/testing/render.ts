import { render as stencilRender } from '@stencil/core';
import type { RenderResult, EventSpy } from '../types.js';
import { setRenderSpyConfig, getComponentSpies, type SpyConfig } from './spy-helper.js';

interface RenderOptions {
  /**
   * Whether to clear existing stage containers before rendering. Defaults to true.
   */
  clearStage?: boolean;
  /**
   * Attributes to set on the stage container element. Defaults to { class: 'stencil-component-stage' }.
   */
  stageAttrs?: Record<string, string>;
  /**
   * Wait for the component to be fully rendered before returning.
   * In browser mode, this polls until the element has dimensions.
   * Defaults to true.
   */
  waitForReady?: boolean;
  /**
   * Spy configuration for this render call. Spies on methods, props, and lifecycle hooks.
   */
  spyOn?: SpyConfig;
}

// Track event spies
const eventSpies = new WeakMap<HTMLElement, EventSpy[]>();

/**
 * Detect if we're running in a real browser vs a mock DOM environment
 */
function isRealBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  if (!navigator.webdriver) return false;

  const ua = navigator?.userAgent ?? '';

  if (ua.includes('jsdom')) return false;
  if ('happyDOM' in window) return false;
  if ('__stencil_mock_doc__' in window) return false;

  if (typeof process !== 'undefined' && process.versions?.node) {
    return false;
  }

  return true;
}

/**
 * Get the hydrated flag config, with defaults when not configured.
 * Returns null if hydration is explicitly disabled.
 */
function getHydratedFlag(): { name: string; selector: 'class' | 'attribute' } | null {
  // If global is defined, use it (could be null if explicitly disabled)
  if (typeof __STENCIL_HYDRATED_FLAG__ !== 'undefined') {
    return __STENCIL_HYDRATED_FLAG__;
  }
  // Default to 'hydrated' class when no config loaded
  return { name: 'hydrated', selector: 'class' };
}

/**
 * Find the first custom element (tag contains '-') in the tree.
 * If the element itself is a custom element, returns it.
 * Otherwise walks down to find the topmost custom element child.
 */
function findCustomElement(element: Element): Element | null {
  if (element.tagName.includes('-')) {
    return element;
  }
  // Breadth-first search for first custom element
  const queue: Element[] = Array.from(element.children);
  while (queue.length > 0) {
    const child = queue.shift()!;
    if (child.tagName.includes('-')) {
      return child;
    }
    queue.push(...Array.from(child.children));
  }
  return null;
}

/**
 * Wait for element to be hydrated based on Stencil's hydrated flag config.
 * Checks for the hydrated class or attribute as configured.
 * Returns immediately if hydration is disabled (flag is null).
 */
async function waitForHydrated(element: Element, timeout = 5000): Promise<void> {
  const flag = getHydratedFlag();

  // If hydration is disabled, skip this check
  if (flag === null) {
    return;
  }

  // Find the custom element to check - hydrated flag is applied to the component, not wrappers
  const customElement = findCustomElement(element);
  if (!customElement) {
    return;
  }

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const isHydrated =
      flag.selector === 'attribute'
        ? customElement.hasAttribute(flag.name)
        : customElement.classList.contains(flag.name);

    if (isHydrated) {
      return;
    }

    await new Promise((r) => requestAnimationFrame(r));
  }
  // Don't throw - component might not use hydration or might be ready without flag
}

/**
 * Poll until element has dimensions (is rendered/visible in real browser).
 * Accepts either an Element or a CSS selector string.
 * If a selector is provided, waits for the element to appear in the DOM first.
 */
export async function waitForStable(elementOrSelector: Element | string, timeout = 5000): Promise<void> {
  if (!isRealBrowser()) {
    console.warn('[waitForStable] Only works in real browser environments');
    return;
  }

  const start = Date.now();

  // Resolve element from selector if needed
  let element: Element | null = typeof elementOrSelector === 'string' ? null : elementOrSelector;

  // If an Element was passed, verify it's in the DOM
  if (element && !document.contains(element)) {
    console.warn('[waitForStable] Element is not attached to the DOM');
  }

  while (Date.now() - start < timeout) {
    // If we have a selector, try to find the element
    if (typeof elementOrSelector === 'string' && !element) {
      element = document.querySelector(elementOrSelector);
    }

    // If we have an element, check if it has dimensions and is visible
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(element);
        const isVisible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.visibility !== 'collapse' &&
          parseFloat(style.opacity) > 0;
        if (isVisible) {
          return;
        }
      }
    }

    await new Promise((r) => requestAnimationFrame(r));
  }
  // Don't throw on timeout - element might be intentionally zero-sized or not found
}

/**
 * Poll until element exists in the DOM.
 * Accepts a CSS selector string and waits for a matching element to appear.
 * Works in both real browsers and mock DOM environments.
 */
export async function waitForExist(selector: string, timeout = 5000): Promise<Element | null> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise((r) => setTimeout(r, 16));
  }

  return null;
}

/**
 * Render using Stencil's render or raw HTML template string
 */
export async function render<T extends HTMLElement = HTMLElement, I = any>(
  template: any | string,
  options: RenderOptions = {
    clearStage: true,
    stageAttrs: { class: 'stencil-component-stage' },
  },
): Promise<RenderResult<T, I>> {
  const container = document.createElement('div');
  Object.entries(options.stageAttrs || {}).forEach(([key, value]) => {
    container.setAttribute(key, value);
  });

  if (options.clearStage) {
    // Clear existing stage containers
    const existingStages = document.body.querySelectorAll('div');
    existingStages.forEach((stage) => stage.remove());
  }
  document.body.appendChild(container);

  // Set per-render spy config before element creation
  if (options.spyOn) {
    setRenderSpyConfig(options.spyOn);
  }

  // Capture lifecycle errors (e.g. throws in componentWillLoad).
  // Stencil's safeCall() catches all lifecycle hook errors and routes them to
  // console.error instead of re-throwing.
  let lifecycleError: unknown;
  const origConsoleError = console.error;
  console.error = (err: unknown, ...rest: unknown[]) => {
    if (err instanceof Error && lifecycleError === undefined) {
      lifecycleError = err;
    }
    origConsoleError(err, ...rest);
  };

  if (typeof template === 'string') {
    // Handle string template - add as innerHTML
    container.innerHTML = template;
  } else {
    // Use Stencil's render which handles VNodes properly in the browser
    await stencilRender(template, container);
  }

  // Get the rendered element
  const element = container.firstElementChild as T;

  if (!element) {
    throw new Error('Failed to render component');
  }

  // Define waitForChanges first so we can use it in the ready check
  function waitForChanges(documentElement: Element = element) {
    return new Promise<void>((resolve) => {
      // Wait for Stencil's RAF-based update cycle
      // Use multiple RAF cycles to ensure all batched updates complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const promiseChain: Promise<void>[] = [];
          const waitComponentOnReady = (elm: Element | ShadowRoot | null, promises: Promise<void>[]) => {
            if (!elm) return;
            if ('shadowRoot' in elm && elm.shadowRoot) {
              waitComponentOnReady(elm.shadowRoot, promises);
            }
            const children = elm.children;
            const len = children.length;
            for (let i = 0; i < len; i++) {
              const childElm = children[i] as HTMLElement & { componentOnReady?: () => Promise<void> };
              if (childElm.tagName.includes('-') && typeof childElm.componentOnReady === 'function') {
                promises.push(childElm.componentOnReady().then(() => {}));
              }
              waitComponentOnReady(childElm, promises);
            }
          };
          waitComponentOnReady(documentElement, promiseChain);
          Promise.all(promiseChain)
            .then(() => resolve())
            .catch(() => resolve());
        });
      });
    });
  }

  // Wait for component to be fully rendered if requested (default: true)
  if (options.waitForReady !== false) {
    // Wait for custom element to be defined
    const tagName = element.tagName.toLowerCase();
    if (tagName.includes('-')) {
      await customElements.whenDefined(tagName);
    }

    // Wait for component to be ready
    if (typeof (element as any).componentOnReady === 'function') {
      await (element as any).componentOnReady();
    }

    // Wait for Stencil's hydration flag (skipped if hydration disabled)
    await waitForHydrated(element);

    // Wait for Stencil's update cycle to complete
    await waitForChanges();
  }

  // Restore console.error now that the lifecycle is done
  console.error = origConsoleError;

  // Re-throw any lifecycle error that Stencil's safeCall swallowed
  if (lifecycleError !== undefined) {
    throw lifecycleError;
  }

  // Clear per-render spy config after component is ready
  if (options.spyOn) {
    setRenderSpyConfig(null);
  }

  const setProps = async (newProps: Record<string, any>) => {
    Object.entries(newProps).forEach(([key, value]) => {
      (element as any)[key] = value;
    });

    // Wait for multiple RAF cycles to ensure Stencil's batched updates complete
    // Stencil batches updates using requestAnimationFrame for performance
    await waitForChanges();

    // Additional RAF cycle to ensure rendering is complete
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  };

  const unmount = () => {
    container.remove();
  };

  const spyOnEvent = (eventName: string): EventSpy => {
    // Return existing spy if already created for this specific event
    const existingSpies = eventSpies.get(container);
    if (existingSpies) {
      const existingSpy = existingSpies.find((spy) => spy.eventName === eventName);
      if (existingSpy) {
        return existingSpy;
      }
    }

    const spy: EventSpy = {
      eventName,
      events: [],
      firstEvent: undefined,
      lastEvent: undefined,
      length: 0,
    };

    // Store listener so we can remove it later
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent;
      spy.events.push(customEvent);
      spy.length = spy.events.length;
      spy.lastEvent = customEvent;
      if (spy.length === 1) {
        spy.firstEvent = customEvent;
      }
    };

    (spy as any)._listener = listener;
    element.addEventListener(eventName, listener);
    // Store the spy
    let spiesForElement = eventSpies.get(container);
    if (!spiesForElement) {
      spiesForElement = [];
      eventSpies.set(container, spiesForElement);
    }
    spiesForElement.push(spy);
    return spy;
  };

  let instance = element;
  if ((element as any).__stencil__getHostRef) {
    instance = (element as any).__stencil__getHostRef()?.$lazyInstance$ || element;
  }

  // Get spies if spyOn option was used
  const spies = options.spyOn ? getComponentSpies(element) : undefined;

  return {
    root: element,
    waitForChanges,
    instance: instance as unknown as I,
    setProps,
    unmount,
    spyOnEvent,
    spies,
  };
}
