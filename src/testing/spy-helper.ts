import { vi, type Mock } from 'vitest';

/**
 * Configuration for what to spy on in a component
 */
export interface SpyConfig {
  /**
   * Method names to spy on
   */
  methods?: string[];
  /**
   * Property names to spy on (tracks setter calls)
   */
  props?: string[];
  /**
   * Lifecycle method names to spy on (e.g., 'componentWillLoad', 'componentDidRender')
   */
  lifecycle?: string[];
}

/**
 * Container for all spies on a component instance
 */
export interface ComponentSpies {
  /**
   * Spies on component methods
   */
  methods: Record<string, Mock>;
  /**
   * Spies on property setters
   */
  props: Record<string, Mock>;
  /**
   * Spies on lifecycle methods
   */
  lifecycle: Record<string, Mock>;
  /**
   * The target instance (either $lazyInstance$ or the element itself for custom-elements output)
   */
  instance: any;
}

// Registry of components to spy on (by tag name)
const spyTargets: Record<string, SpyConfig> = {};
// Store spies by element reference (after applied)
const elementSpies = new WeakMap<HTMLElement, ComponentSpies>();
// Store pending spy configs by element (before applied)
const pendingSpies = new WeakMap<HTMLElement, { instance: any; config: SpyConfig }>();

// Per-render spy config (set by render(), consumed by constructor)
let pendingRenderConfig: SpyConfig | null = null;

/**
 * Set spy config for the next render call. Used internally by render().
 * @internal
 */
export function setRenderSpyConfig(config: SpyConfig | null): void {
  pendingRenderConfig = config;
}

// Store original define before patching
const origDefine = customElements.define.bind(customElements);

/**
 * Apply spies to a target instance (shared logic)
 */
function applySpies(target: any, config: SpyConfig): ComponentSpies {
  const spies: ComponentSpies = {
    methods: {},
    props: {},
    lifecycle: {},
    instance: target,
  };

  // Spy on methods
  if (config.methods) {
    for (const methodName of config.methods) {
      const method = target[methodName];
      if (typeof method === 'function' && !(method as any).__isSpy) {
        const spy = vi.fn((...args: any[]) => method.apply(target, args)) as Mock & { __isSpy?: boolean };
        spy.__isSpy = true;
        spies.methods[methodName] = spy;

        Object.defineProperty(target, methodName, {
          value: spy,
          writable: true,
          configurable: true,
        });
      }
    }
  }

  // Spy on props - need to intercept $instanceValues$ since Stencil stores props there
  if (config.props) {
    const hostRef = target.__stencil__getHostRef?.();
    const instanceValues = hostRef?.$instanceValues$;

    if (instanceValues) {
      // Wrap the Map's set method to intercept prop changes
      const originalSet = instanceValues.set.bind(instanceValues);
      instanceValues.set = (key: string, value: any) => {
        const result = originalSet(key, value);
        // If this prop is being spied on, call the spy
        if (config.props!.includes(key) && spies.props[key]) {
          spies.props[key](value);
        }
        return result;
      };
    }

    // Create spies for each prop
    for (const propName of config.props) {
      const spy = vi.fn();
      spies.props[propName] = spy;
    }
  }

  // Spy on lifecycle methods (auto-stub if not defined)
  if (config.lifecycle) {
    for (const lifecycleName of config.lifecycle) {
      const method = target[lifecycleName];
      let spy: Mock & { __isSpy?: boolean };

      if (typeof method === 'function' && !(method as any).__isSpy) {
        // Method exists - wrap it
        spy = vi.fn((...args: any[]) => method.apply(target, args)) as Mock & { __isSpy?: boolean };
      } else if (typeof method !== 'function') {
        // Method doesn't exist - create stub so Stencil will call it
        spy = vi.fn() as Mock & { __isSpy?: boolean };
      } else {
        // Already a spy
        continue;
      }

      spy.__isSpy = true;
      spies.lifecycle[lifecycleName] = spy;

      Object.defineProperty(target, lifecycleName, {
        value: spy,
        writable: true,
        configurable: true,
      });
    }
  }

  return spies;
}

// Patch customElements.define to intercept component registration
customElements.define = function (
  name: string,
  ctor: CustomElementConstructor,
  options?: ElementDefinitionOptions,
) {
  const lc = name.toLowerCase();
  const OrigCtor = ctor;

  // Wrap ALL components to enable per-render spies without module-level registration
  const Wrapped = class extends OrigCtor {
    constructor(...args: any[]) {
      super(...args);

      // Check for spy config: per-render takes priority, then module-level
      // Capture config NOW at constructor time (before async callbacks)
      const configToUse = pendingRenderConfig || spyTargets[lc];
      if (!configToUse) return; // No spying configured, quick exit

      // After super(), registerHost has run and we have access to hostRef
      const hostRef = (this as any).__stencil__getHostRef?.();

      if (hostRef && hostRef.$fetchedCbList$) {
        // Lazy-load path: Use $fetchedCbList$ to apply spies after constructor but before render
        const element = this as unknown as HTMLElement;
        // Capture config in closure for when callback executes
        const capturedConfig = configToUse;
        hostRef.$fetchedCbList$.push(() => {
          const instance = hostRef.$lazyInstance$;
          if (instance) {
            const spies = applySpies(instance, capturedConfig);
            elementSpies.set(element, spies);
          }
        });
      } else if (hostRef) {
        // Fallback: Store for lazy application
        pendingSpies.set(this as unknown as HTMLElement, { instance: hostRef.$lazyInstance$ || this, config: configToUse });
      } else {
        // Custom-elements output path: element IS the instance
        const spies = applySpies(this, configToUse);
        elementSpies.set(this as unknown as HTMLElement, spies);
      }
    }
  };

  return origDefine.call(customElements, name, Wrapped, options);
};

/**
 * Register spy targets for a component. Must be called BEFORE the component is defined/rendered.
 *
 * Works with both output targets:
 * - **dist/lazy**: Spies are applied to `$lazyInstance$` when it's created
 * - **dist-custom-elements**: Spies are applied to the element itself
 *
 * @example
 * ```ts
 * // At module level, before any tests
 * spyOnComponent('my-button', {
 *   methods: ['handleClick', 'validate'],
 *   props: ['value', 'disabled'],
 *   lifecycle: ['componentWillLoad'],
 * });
 *
 * // Then render and get spies
 * const { root } = await render(<my-button />);
 * const spies = getComponentSpies(root);
 *
 * // Assert on method calls
 * expect(spies?.methods.handleClick).toHaveBeenCalled();
 * ```
 */
export function spyOnComponent(tagName: string, config: SpyConfig): void {
  spyTargets[tagName.toLowerCase()] = config;
}

/**
 * Get the spies for a rendered component instance.
 * Spies are lazily applied on first call to ensure the instance is fully constructed.
 *
 * @param element - The rendered component element
 * @returns The spies object or undefined if no spies were registered
 */
export function getComponentSpies(element: HTMLElement): ComponentSpies | undefined {
  // Return existing spies if already applied
  const existing = elementSpies.get(element);
  if (existing) {
    return existing;
  }

  // Check for pending spy config
  const pending = pendingSpies.get(element);
  if (pending) {
    // Apply spies now that the instance is fully constructed
    const spies = applySpies(pending.instance, pending.config);
    elementSpies.set(element, spies);
    pendingSpies.delete(element);
    return spies;
  }

  return undefined;
}

/**
 * Clear spy registrations. Call this in afterEach to reset state between tests.
 *
 * @param tagName - Optional tag name to clear. If omitted, clears all registrations.
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   clearComponentSpies(); // Clear all
 * });
 *
 * // Or clear specific component
 * clearComponentSpies('my-button');
 * ```
 */
export function clearComponentSpies(tagName?: string): void {
  if (tagName) {
    delete spyTargets[tagName.toLowerCase()];
  } else {
    for (const key of Object.keys(spyTargets)) {
      delete spyTargets[key];
    }
  }
}

/**
 * Create a mock implementation for a component method.
 * Useful for controlling return values or throwing errors in tests.
 *
 * @example
 * ```ts
 * const spies = getComponentSpies(root);
 * mockImplementation(spies.methods.fetchData, async () => ({ data: 'mocked' }));
 * ```
 */
export function mockImplementation<T extends (...args: any[]) => any>(
  spy: Mock,
  implementation: T
): void {
  spy.mockImplementation(implementation);
}

/**
 * Create a mock return value for a component method.
 *
 * @example
 * ```ts
 * const spies = getComponentSpies(root);
 * mockReturnValue(spies.methods.getValue, 42);
 * ```
 */
export function mockReturnValue<T>(spy: Mock, value: T): void {
  spy.mockReturnValue(value);
}
