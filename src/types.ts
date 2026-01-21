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
}

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
}
