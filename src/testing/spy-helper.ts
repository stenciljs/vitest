import { vi, type Mock } from 'vitest';

/**
 * Base configuration for what to spy on in a component
 */
interface SpyConfigBase {
  /**
   * Method names to spy on (calls original implementation)
   */
  methods?: string[];
  /**
   * Pre-configured mocks to replace methods. The mock is applied before lifecycle runs,
   * allowing you to control return values for methods called during initialization.
   * @example
   * ```ts
   * const loadUserMock = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
   * const { root } = await render(<my-component />, {
   *   spyOn: { mocks: { loadUser: loadUserMock } }
   * });
   * expect(loadUserMock).toHaveBeenCalled();
   * ```
   */
  mocks?: Record<string, Mock>;
  /**
   * Property names to spy on
   */
  props?: string[];
  /**
   * Lifecycle method names to spy on ('componentWillLoad', 'componentDidRender')
   */
  lifecycle?: string[];
}

/**
 * Configuration for what to spy on in a component.
 * Can include per-component overrides via the `components` property.
 */
export interface SpyConfig extends SpyConfigBase {
  /**
   * Per-component spy configurations, keyed by tag name.
   * These override the base config for specific components.
   * @example
   * ```ts
   * spyOn: {
   *   lifecycle: ['componentDidLoad'], // applies to all
   *   components: {
   *     'my-select': { methods: ['open', 'close'] },
   *     'my-option': { methods: ['select'] },
   *   }
   * }
   * ```
   */
  components?: Record<string, SpyConfigBase>;
}

/**
 * A mock with access to the original implementation
 */
interface MockWithOriginal extends Mock {
  /**
   * The original method implementation, bound to the component instance.
   * Call this within mockImplementation to augment rather than replace.
   */
  original?: (...args: any[]) => any;
}

/**
 * Container for all spies on a component instance
 */
export interface ComponentSpies {
  /**
   * Spies on component methods (calls through to original)
   */
  methods: Record<string, Mock>;
  /**
   * Mocks on component methods (pure stubs, doesn't call original).
   * Each mock has an `original` property to access the original implementation.
   */
  mocks: Record<string, MockWithOriginal>;
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
  /**
   * Reset all spies/mocks - clears call history AND resets implementations to default.
   */
  resetAll: () => void;
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
 * Resolve the spy config for a specific tag, merging base config with per-component overrides.
 */
function resolveConfigForTag(config: SpyConfig, tagName: string): SpyConfigBase | null {
  const tagLower = tagName.toLowerCase();
  const tagConfig = config.components?.[tagLower];

  // Extract base config (everything except `components`)
  const { components: _components, ...baseConfig } = config;
  const hasBaseConfig =
    baseConfig.methods?.length ||
    (baseConfig.mocks && Object.keys(baseConfig.mocks).length) ||
    baseConfig.props?.length ||
    baseConfig.lifecycle?.length;

  if (!tagConfig && !hasBaseConfig) {
    return null; // No config applies to this tag
  }

  if (!tagConfig) {
    return baseConfig; // Only base config
  }

  if (!hasBaseConfig) {
    return tagConfig; // Only tag-specific config
  }

  // Merge: tag-specific config extends base config
  return {
    methods: [...(baseConfig.methods || []), ...(tagConfig.methods || [])],
    mocks: { ...(baseConfig.mocks || {}), ...(tagConfig.mocks || {}) },
    props: [...(baseConfig.props || []), ...(tagConfig.props || [])],
    lifecycle: [...(baseConfig.lifecycle || []), ...(tagConfig.lifecycle || [])],
  };
}

/**
 * Set spy config for the next render call. Used internally by render().
 * @internal
 */
export function setRenderSpyConfig(config: SpyConfig | null): void {
  pendingRenderConfig = config;
}

// Store original define before patching (only in browser/jsdom environments)
const origDefine = typeof customElements !== 'undefined' ? customElements.define.bind(customElements) : undefined;

/**
 * Apply spies to a target instance (shared logic)
 */
function applySpies(target: any, config: SpyConfig): ComponentSpies {
  const spies: ComponentSpies = {
    methods: {},
    mocks: {},
    props: {},
    lifecycle: {},
    instance: target,
    resetAll() {
      // Reset all method spies
      for (const spy of Object.values(this.methods) as Mock[]) {
        spy.mockReset();
      }
      // Reset all mocks
      for (const mock of Object.values(this.mocks) as Mock[]) {
        mock.mockReset();
      }
      // Reset all prop spies
      for (const spy of Object.values(this.props) as Mock[]) {
        spy.mockReset();
      }
      // Reset all lifecycle spies
      for (const spy of Object.values(this.lifecycle) as Mock[]) {
        spy.mockReset();
      }
    },
  };

  // Spy on methods (calls through to original)
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

  // Mock methods (use pre-configured mocks, original is accessible)
  if (config.mocks) {
    for (const [methodName, mock] of Object.entries(config.mocks)) {
      const original = target[methodName];
      const mockWithOriginal = mock as MockWithOriginal & { __isSpy?: boolean };
      mockWithOriginal.__isSpy = true;
      // Store the original so users can call it if they want to augment rather than replace
      if (typeof original === 'function') {
        mockWithOriginal.original = (...args: any[]) => original.apply(target, args);
      }
      spies.mocks[methodName] = mockWithOriginal;

      Object.defineProperty(target, methodName, {
        value: mockWithOriginal,
        writable: true,
        configurable: true,
      });
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

// Patch customElements.define to intercept component registration (only in browser/jsdom environments)
if (typeof customElements !== 'undefined' && origDefine) {
  customElements.define = function (name: string, ctor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    const lc = name.toLowerCase();
    const OrigCtor = ctor;

    // Wrap ALL components to enable per-render spies without module-level registration
    const Wrapped = class extends OrigCtor {
      constructor(...args: any[]) {
        super(...args);

        // Check for spy config: per-render takes priority, then module-level
        // Capture config now, at constructor time (before async callbacks)
        const baseConfig = pendingRenderConfig || spyTargets[lc];
        if (!baseConfig) return; // No spying configured, quick exit

        // Resolve config for this specific tag (handles per-component overrides)
        const configToUse = resolveConfigForTag(baseConfig, lc);
        if (!configToUse) return; // No config applies to this tag

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
          // Custom-elements output with Stencil runtime: element IS the instance
          // Apply spies immediately since there's no lazy loading
          const spies = applySpies(this, configToUse);
          elementSpies.set(this as unknown as HTMLElement, spies);
        } else {
          // Custom-elements output path: element IS the instance
          const spies = applySpies(this, configToUse);
          elementSpies.set(this as unknown as HTMLElement, spies);
        }
      }
    };

    return origDefine.call(customElements, name, Wrapped, options);
  };
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
