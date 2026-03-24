/**
 * Event spy for testing custom events
 */
export interface EventSpy {
  /**
   * Name of the event being spied on
   */
  eventName: string;

  /**
   * All events that have been received
   */
  events: CustomEvent[];

  /**
   * First event received (if any)
   */
  firstEvent: CustomEvent | undefined;

  /**
   * Last event received (if any)
   */
  lastEvent: CustomEvent | undefined;

  /**
   * Number of events received
   */
  length: number;
}

import type { SpyConfig } from './testing/spy-helper.js';

/**
 * Component render options
 */
export interface RenderOptions {
  /**
   * Props to pass to the component
   */
  props?: Record<string, any>;

  /**
   * Slots content (for shadow DOM components)
   */
  slots?: Record<string, string | HTMLElement>;

  /**
   * HTML content to place inside the component
   */
  html?: string;

  /**
   * Wait for component to be loaded before returning
   * @default true
   */
  waitForLoad?: boolean;

  /**
   * Additional HTML attributes
   */
  attributes?: Record<string, string>;

  /**
   * Spy configuration for this render call. Spies on methods, props, and lifecycle hooks.
   * Takes priority over module-level spyOnComponent() calls.
   */
  spyOn?: SpyConfig;
}

import type { ComponentSpies } from './testing/spy-helper.js';

/**
 * Render result for component testing
 */
export interface RenderResult<T = HTMLElement, I = any> {
  /**
   * The rendered root element
   */
  root: T;

  /**
   * Wait for changes to be applied
   */
  waitForChanges: () => Promise<void>;

  /**
   * Tries to get the underlying class instance when `root` is a Stencil component.
   * If using `dist-custom-elements`, `instance` === `root`.
   */
  instance?: I;

  /**
   * Update component props
   */
  setProps: (props: Record<string, any>) => Promise<void>;

  /**
   * Unmount/cleanup the component
   */
  unmount: () => void;

  /**
   * Spy on a custom event
   */
  spyOnEvent: (eventName: string) => EventSpy;

  /**
   * Component spies (only present when `spyOn` option is used)
   */
  spies?: ComponentSpies;
}
