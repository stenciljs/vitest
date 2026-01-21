import { render as stencilRender } from '@stencil/core';
import type { RenderResult, EventSpy } from '../types.js';

interface RenderOptions {
  clearStage?: boolean;
  stageAttrs?: Record<string, string>;
}

// Track event spies
const eventSpies = new WeakMap<HTMLElement, EventSpy[]>();

/**
 * Render using Stencil's render
 */
export async function render<T extends HTMLElement = HTMLElement, I = any>(
  vnode: any,
  options: RenderOptions = {
    clearStage: true,
    stageAttrs: { class: 'stencil-component-stage' },
  },
): Promise<RenderResult<T, I>> {
  // Use Stencil's render which handles VNodes properly in the browser
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

  await stencilRender(vnode, container);

  // Get the rendered element
  const element = container.firstElementChild as T;

  if (!element) {
    throw new Error('Failed to render component');
  }

  // Wait for component to be ready
  if (typeof (element as any).componentOnReady === 'function') {
    await (element as any).componentOnReady();
  }

  function waitForChanges(documentElement = element) {
    return new Promise<void>((resolve) => {
      // Wait for Stencil's RAF-based update cycle
      // Use multiple RAF cycles to ensure all batched updates complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const promiseChain = [];
          const waitComponentOnReady = (elm, promises) => {
            if (!elm) return;
            if ('shadowRoot' in elm) {
              waitComponentOnReady(elm.shadowRoot, promises);
            }
            const children = elm.children;
            const len = children.length;
            for (let i = 0; i < len; i++) {
              const childElm = children[i];
              const childStencilElm = childElm;
              if (childElm.tagName.includes('-') && typeof childStencilElm.componentOnReady === 'function') {
                promises.push(childStencilElm.componentOnReady().then(() => {}));
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
    // Return existing spy if already created
    if (eventSpies.has(container)) {
      return eventSpies.get(container)!.find((spy) => spy.eventName === eventName)!;
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

  return {
    root: element,
    waitForChanges,
    instance: instance as unknown as I,
    setProps,
    unmount,
    spyOnEvent,
  };
}
