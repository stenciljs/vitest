import { describe, it, expect, h, getComponentSpies } from '@stencil/vitest';
import { render } from '@stencil/vitest';

const spyConfig = {
  methods: ['handleClick'],
  props: ['variant', 'disabled'],
};

describe('spy-helper', () => {
  describe('method spying', () => {
    it('spies on component methods', async () => {
      const { root, spies } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });

      expect(spies).toBeDefined();
      expect(spies?.methods.handleClick).toBeDefined();

      const button = root.shadowRoot?.querySelector('button');
      button?.click();

      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(1);
    });

    it('tracks multiple method calls', async () => {
      const { root, spies } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });
      const button = root.shadowRoot?.querySelector('button');

      button?.click();
      button?.click();
      button?.click();

      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(3);
    });

    it('captures method arguments', async () => {
      const { root, spies } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });
      const button = root.shadowRoot?.querySelector('button');

      button?.click();

      // handleClick receives the MouseEvent
      expect(spies?.methods.handleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('can reset method spy call history', async () => {
      const { root, spies } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });
      const button = root.shadowRoot?.querySelector('button');

      button?.click();
      button?.click();
      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(2);

      // Reset the spy
      spies?.methods.handleClick.mockClear();

      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(0);

      // New clicks are tracked fresh
      button?.click();
      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('prop spying', () => {
    it('spies on prop setters', async () => {
      const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
        spyOn: spyConfig,
      });

      expect(spies).toBeDefined();
      expect(spies?.props.variant).toBeDefined();

      await setProps({ variant: 'danger' });
      await waitForChanges();

      expect(spies?.props.variant).toHaveBeenCalledWith('danger');
    });

    it('tracks multiple prop changes', async () => {
      const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
        spyOn: spyConfig,
      });

      await setProps({ variant: 'secondary' });
      await waitForChanges();
      await setProps({ variant: 'danger' });
      await waitForChanges();

      expect(spies?.props.variant).toHaveBeenCalledTimes(2);
      expect(spies?.props.variant).toHaveBeenNthCalledWith(1, 'secondary');
      expect(spies?.props.variant).toHaveBeenNthCalledWith(2, 'danger');
    });

    it('can reset prop spy call history', async () => {
      const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
        spyOn: spyConfig,
      });

      await setProps({ variant: 'danger' });
      await waitForChanges();
      expect(spies?.props.variant).toHaveBeenCalledTimes(1);

      spies?.props.variant.mockClear();

      expect(spies?.props.variant).toHaveBeenCalledTimes(0);

      await setProps({ variant: 'secondary' });
      await waitForChanges();
      expect(spies?.props.variant).toHaveBeenCalledTimes(1);
      expect(spies?.props.variant).toHaveBeenCalledWith('secondary');
    });

    it('spies on multiple props independently', async () => {
      const { spies, setProps, waitForChanges } = await render(
        <my-button variant="primary" disabled={false}>
          Click me
        </my-button>,
        { spyOn: spyConfig },
      );

      await setProps({ variant: 'danger', disabled: true });
      await waitForChanges();

      expect(spies?.props.variant).toHaveBeenCalledWith('danger');
      expect(spies?.props.disabled).toHaveBeenCalledWith(true);
    });
  });

  describe('instance access', () => {
    it('render returns the $lazyInstance$ as instance', async () => {
      const { instance } = await render(<my-button variant="secondary">Click me</my-button>);

      expect(instance).toBeDefined();
      expect(instance.variant).toBe('secondary');
      expect(typeof instance.handleClick).toBe('function');
    });

    it('provides access to the instance via spies.instance', async () => {
      const { spies } = await render(<my-button variant="danger">Click me</my-button>, { spyOn: spyConfig });

      expect(spies?.instance).toBeDefined();
      expect(spies?.instance.variant).toBe('danger');
    });

    it('spies.instance is the same as render instance', async () => {
      const { instance, spies } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });

      expect(spies?.instance).toBe(instance);
    });
  });

  describe('spy utilities', () => {
    it('method spy still calls original implementation', async () => {
      const { root, spies, spyOnEvent } = await render(<my-button>Click me</my-button>, { spyOn: spyConfig });
      const buttonClickSpy = spyOnEvent('buttonClick');

      const button = root.shadowRoot?.querySelector('button');
      button?.click();

      // Spy was called
      expect(spies?.methods.handleClick).toHaveBeenCalled();
      // Original implementation ran (emitted event)
      expect(buttonClickSpy.length).toBe(1);
    });
  });

  describe('lifecycle spying', () => {
    it('auto-stubs undefined lifecycle methods', async () => {
      // my-button has no componentWillLoad defined, but we can still spy on it
      const { spies } = await render(<my-button>Click me</my-button>, {
        spyOn: { lifecycle: ['componentWillLoad'] },
      });

      expect(spies?.lifecycle.componentWillLoad).toBeDefined();
      // Stencil should have called it during initial render
      expect(spies?.lifecycle.componentWillLoad).toHaveBeenCalledTimes(1);
    });

    it('tracks multiple lifecycle methods', async () => {
      const { spies } = await render(<my-button>Click me</my-button>, {
        spyOn: { lifecycle: ['componentWillLoad', 'componentDidLoad', 'componentWillRender', 'componentDidRender'] },
      });

      // All should be defined and called during initial render
      expect(spies?.lifecycle.componentWillLoad).toHaveBeenCalled();
      expect(spies?.lifecycle.componentDidLoad).toHaveBeenCalled();
      expect(spies?.lifecycle.componentWillRender).toHaveBeenCalled();
      expect(spies?.lifecycle.componentDidRender).toHaveBeenCalled();
    });

    it('tracks re-render lifecycle methods on prop change', async () => {
      const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
        spyOn: { lifecycle: ['componentWillRender', 'componentDidRender'] },
      });

      // Initial render
      expect(spies?.lifecycle.componentWillRender).toHaveBeenCalledTimes(1);
      expect(spies?.lifecycle.componentDidRender).toHaveBeenCalledTimes(1);

      // Trigger re-render
      await setProps({ variant: 'danger' });
      await waitForChanges();

      // Should have been called again
      expect(spies?.lifecycle.componentWillRender).toHaveBeenCalledTimes(2);
      expect(spies?.lifecycle.componentDidRender).toHaveBeenCalledTimes(2);
    });
  });

  describe('method mocking', () => {
    it('mocks replace method without calling original', async () => {
      const { root, spies, spyOnEvent } = await render(<my-button>Click me</my-button>, {
        spyOn: { mocks: ['handleClick'] },
      });
      const buttonClickSpy = spyOnEvent('buttonClick');

      expect(spies?.mocks.handleClick).toBeDefined();

      const button = root.shadowRoot?.querySelector('button');
      button?.click();

      // Mock was called
      expect(spies?.mocks.handleClick).toHaveBeenCalledTimes(1);
      // But original implementation did NOT run (no event emitted)
      expect(buttonClickSpy.length).toBe(0);
    });

    it('mocks can have custom return values', async () => {
      const { spies } = await render(<my-button>Click me</my-button>, {
        spyOn: { mocks: ['handleClick'] },
      });

      spies?.mocks.handleClick.mockReturnValue('mocked!');

      const result = spies?.instance.handleClick();
      expect(result).toBe('mocked!');
    });

    it('mocks can have custom implementations', async () => {
      const { spies } = await render(<my-button>Click me</my-button>, {
        spyOn: { mocks: ['handleClick'] },
      });

      let called = false;
      spies?.mocks.handleClick.mockImplementation(() => {
        called = true;
      });

      spies?.instance.handleClick();
      expect(called).toBe(true);
    });
  });

  describe('per-render isolation', () => {
    it('different renders can have different spy configs', async () => {
      // First render: only spy on methods
      const { root: root1, spies: spies1 } = await render(<my-button>Button 1</my-button>, {
        spyOn: { methods: ['handleClick'] },
      });

      // Second render: only spy on props
      const {
        spies: spies2,
        setProps,
        waitForChanges,
      } = await render(<my-button variant="primary">Button 2</my-button>, {
        spyOn: { props: ['variant'] },
      });

      // First has method spy, no prop spy
      expect(spies1?.methods.handleClick).toBeDefined();
      expect(spies1?.props.variant).toBeUndefined();

      // Second has prop spy, no method spy
      expect(spies2?.props.variant).toBeDefined();
      expect(spies2?.methods.handleClick).toBeUndefined();

      // Both work independently
      root1.shadowRoot?.querySelector('button')?.click();
      expect(spies1?.methods.handleClick).toHaveBeenCalledTimes(1);

      await setProps({ variant: 'danger' });
      await waitForChanges();
      expect(spies2?.props.variant).toHaveBeenCalledWith('danger');
    });

    it('render without spyOn has no spies', async () => {
      const { spies } = await render(<my-button>No spies</my-button>);

      expect(spies).toBeUndefined();
    });
  });

  describe('resetAll', () => {
    it('resets all spy call histories and implementations', async () => {
      const { root, spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
        spyOn: {
          methods: ['handleClick'],
          props: ['variant'],
          lifecycle: ['componentDidRender'],
        },
      });

      // Trigger some calls
      root.shadowRoot?.querySelector('button')?.click();
      await setProps({ variant: 'danger' });
      await waitForChanges();

      // Verify calls were tracked
      expect(spies?.methods.handleClick).toHaveBeenCalled();
      expect(spies?.props.variant).toHaveBeenCalled();
      expect(spies?.lifecycle.componentDidRender).toHaveBeenCalled();

      // Reset all
      spies?.resetAll();

      // All call histories should be cleared
      expect(spies?.methods.handleClick).toHaveBeenCalledTimes(0);
      expect(spies?.props.variant).toHaveBeenCalledTimes(0);
      expect(spies?.lifecycle.componentDidRender).toHaveBeenCalledTimes(0);
    });

    it('resets mock implementations to default', async () => {
      const { spies } = await render(<my-button>Click me</my-button>, {
        spyOn: { mocks: ['handleClick'] },
      });

      // Set a custom mock implementation
      spies?.mocks.handleClick.mockReturnValue('custom');
      expect(spies?.instance.handleClick()).toBe('custom');

      // Reset all
      spies?.resetAll();

      // Mock should return undefined now (default)
      expect(spies?.instance.handleClick()).toBeUndefined();
    });
  });

  describe('nested components', () => {
    it('can get spies for nested custom elements via getComponentSpies', async () => {
      // Render with a wrapper div
      const { root } = await render(
        <div>
          <my-button>Nested button</my-button>
        </div>,
        {
          spyOn: { methods: ['handleClick'] },
        },
      );

      // Root is the div, not the custom element
      expect(root.tagName.toLowerCase()).toBe('div');

      // Find the nested custom element
      const nestedButton = root.querySelector('my-button') as HTMLElement;
      expect(nestedButton).toBeDefined();

      // Get spies for the nested element
      const nestedSpies = getComponentSpies(nestedButton);
      expect(nestedSpies).toBeDefined();
      expect(nestedSpies?.methods.handleClick).toBeDefined();

      // Trigger and verify
      nestedButton.shadowRoot?.querySelector('button')?.click();
      expect(nestedSpies?.methods.handleClick).toHaveBeenCalledTimes(1);
    });

    it('multiple instances have independent spies', async () => {
      const { root } = await render(
        <div>
          <my-button class="first">First</my-button>
          <my-button class="second">Second</my-button>
        </div>,
        {
          spyOn: { methods: ['handleClick'] },
        },
      );

      const first = root.querySelector('.first') as HTMLElement;
      const second = root.querySelector('.second') as HTMLElement;

      const firstSpies = getComponentSpies(first);
      const secondSpies = getComponentSpies(second);

      // Both should have spies
      expect(firstSpies?.methods.handleClick).toBeDefined();
      expect(secondSpies?.methods.handleClick).toBeDefined();

      // They should be independent
      first.shadowRoot?.querySelector('button')?.click();
      expect(firstSpies?.methods.handleClick).toHaveBeenCalledTimes(1);
      expect(secondSpies?.methods.handleClick).toHaveBeenCalledTimes(0);

      second.shadowRoot?.querySelector('button')?.click();
      second.shadowRoot?.querySelector('button')?.click();
      expect(firstSpies?.methods.handleClick).toHaveBeenCalledTimes(1);
      expect(secondSpies?.methods.handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('per-component spy configs', () => {
    it('applies different spy configs to different component types', async () => {
      const { root } = await render(
        <my-card cardTitle="Test Card">
          <my-button slot="footer">Click me</my-button>
        </my-card>,
        {
          spyOn: {
            components: {
              'my-card': { props: ['cardTitle', 'elevation'] },
              'my-button': { methods: ['handleClick'] },
            },
          },
        },
      );

      // Get spies for each component
      const cardSpies = getComponentSpies(root);
      const buttonSpies = getComponentSpies(root.querySelector('my-button') as HTMLElement);

      // my-card should have prop spies but no method spies
      expect(cardSpies).toBeDefined();
      expect(cardSpies?.props.cardTitle).toBeDefined();
      expect(cardSpies?.props.elevation).toBeDefined();
      expect(cardSpies?.methods.handleClick).toBeUndefined();

      // my-button should have method spies but no prop spies
      expect(buttonSpies).toBeDefined();
      expect(buttonSpies?.methods.handleClick).toBeDefined();
      expect(buttonSpies?.props.cardTitle).toBeUndefined();

      // Verify they work
      root.querySelector('my-button')?.shadowRoot?.querySelector('button')?.click();
      expect(buttonSpies?.methods.handleClick).toHaveBeenCalledTimes(1);
    });

    it('merges base config with per-component config', async () => {
      const { root, waitForChanges } = await render(
        <my-card cardTitle="Test Card">
          <my-button>Click me</my-button>
        </my-card>,
        {
          spyOn: {
            // Base config - applies to all components
            lifecycle: ['componentDidLoad'],
            // Per-component overrides - merged with base
            components: {
              'my-card': { props: ['cardTitle'] },
              'my-button': { methods: ['handleClick'] },
            },
          },
        },
      );

      await waitForChanges();

      const cardSpies = getComponentSpies(root);
      const buttonSpies = getComponentSpies(root.querySelector('my-button') as HTMLElement);

      // Both should have lifecycle spy from base config
      expect(cardSpies?.lifecycle.componentDidLoad).toBeDefined();
      expect(buttonSpies?.lifecycle.componentDidLoad).toBeDefined();

      // Each should also have their component-specific spies
      expect(cardSpies?.props.cardTitle).toBeDefined();
      expect(buttonSpies?.methods.handleClick).toBeDefined();

      // Lifecycle should have been called during render
      expect(cardSpies?.lifecycle.componentDidLoad).toHaveBeenCalled();
      expect(buttonSpies?.lifecycle.componentDidLoad).toHaveBeenCalled();
    });

    it('component without specific config only gets base config', async () => {
      const { root } = await render(
        <my-card cardTitle="Test Card">
          <my-button>Click me</my-button>
        </my-card>,
        {
          spyOn: {
            lifecycle: ['componentDidLoad'],
            components: {
              // Only my-button has specific config
              'my-button': { methods: ['handleClick'] },
            },
          },
        },
      );

      const cardSpies = getComponentSpies(root);
      const buttonSpies = getComponentSpies(root.querySelector('my-button') as HTMLElement);

      // my-card only gets base lifecycle spy
      expect(cardSpies?.lifecycle.componentDidLoad).toBeDefined();
      expect(cardSpies?.methods.handleClick).toBeUndefined();

      // my-button gets base + component-specific
      expect(buttonSpies?.lifecycle.componentDidLoad).toBeDefined();
      expect(buttonSpies?.methods.handleClick).toBeDefined();
    });
  });
});
