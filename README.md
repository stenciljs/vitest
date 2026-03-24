# @stencil/vitest

First-class testing utilities for Stencil components, powered by Vitest.

## Quick Start

### 1. Install

```bash
npm i --save-dev @stencil/vitest vitest
```

For browser testing, also install:

```bash
npm i -D @vitest/browser-playwright
# or
npm i -D @vitest/browser-webdriverio
```

### 2. Create `vitest.config.ts`

```typescript
import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Unit tests - node environment for functions / logic
      {
        test: {
          name: 'unit',
          include: ['src/**/*.unit.{ts,tsx}'],
          environment: 'node',
        },
      },
      // Spec tests - via a node DOM of your choice
      {
        test: {
          name: 'spec',
          include: ['src/**/*.spec.{ts,tsx}'],
          environment: 'stencil',
          setupFiles: ['./vitest-setup.ts'],

          // Optional environment options

          // environmentOptions: {
          //   stencil: {
          //     domEnvironment: 'happy-dom' | 'jsdom' | 'mock-doc' (default)
          //                      ^^ Make sure to install relevant packages
          //   },
          // },
        },
      },
      // Browser tests
      {
        test: {
          name: 'browser',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
```

[refer to Vitest's documentation for all configuration options](https://vitest.dev/config/)

### 3. Load your components

```typescript
// vitest-setup.ts

// Load Stencil components.
// Adjust according to your build output of choice *
await import('./dist/test-components/test-components.esm.js');

export {};
// * Bear in mind, you may need `buildDist: true` (in your stencil.config)
// or `--prod` to use an output other than the browser lazy-loader
```

### 4. Write Tests

```tsx
// src/components/my-button/my-button.spec.tsx

import { render, h, describe, it, expect } from '@stencil/vitest';

describe('my-button', () => {
  it('renders with text', async () => {
    const { root, waitForChanges } = await render(<my-button label="Click me" />);
    root.click();
    await waitForChanges();
    await expect(root).toEqualHtml(`
      <my-button class="hydrated">
        <mock:shadow-root>
          <button class="button button--secondary button--small" type="button">
            <slot></slot>
          </button>
        </mock:shadow-root>
        Small
      </my-button>
    `);
  });
});
```

### 5. Run tests

```json
// package.json
{
  "scripts": {
    "test": "stencil-test",
    "test:watch": "stencil-test --watch",
    "test:e2e": "stencil-test --project browser",
    "test:spec": "stencil-test --project spec"
  }
}
```

## API

### Rendering

#### `render(VNode)`

Render a component for testing.

```tsx
import { render, h } from '@stencil/vitest';

const { root, waitForChanges, setProps, unmount } = await render(<my-component name="World" />);

// Access the element
expect(root.textContent).toContain('World');

// Update props
root.name = 'Stencil';
await waitForChanges();
// or
await setProps({ name: 'Stencil' });

// Unmount component
unmount();
```

### Available matchers:

```typescript
// DOM assertions
expect(element).toHaveClass('active');
expect(element).toHaveClasses(['active', 'primary']); // Contains all / partial match
expect(element).toMatchClasses(['active']); // Exact match
expect(element).toHaveAttribute('aria-label', 'Close');
expect(element).toEqualAttribute('type', 'button');
expect(element).toEqualAttributes({ type: 'button', disabled: true });
expect(element).toHaveProperty('value', 'test');
expect(element).toHaveTextContent('Hello World'); // includes shadow DOM text
expect(element).toHaveLightTextContent('Hello World'); // light DOM only
expect(element).toEqualText('Exact text match'); // includes shadow DOM text
expect(element).toEqualLightText('Exact text match'); // light DOM only

// Shadow DOM
expect(element).toHaveShadowRoot();
await expect(element).toEqualHtml('<div>Expected HTML</div>');
await expect(element).toEqualLightHtml('<div>Light DOM only</div>');
```

### Spying and Mocking

Spy on component methods, props, and lifecycle hooks to verify behaviour without modifying your component code.

> **Setup requirement:** Load your components in a `beforeAll` block (typically in your setup file). The spy system patches `customElements.define`, so components must be registered after the test framework initializes.
>
> ```diff
> // vitest-setup.ts
> - await import('./dist/test-components/test-components.esm.js');
>
> + import { beforeAll } from 'vitest';
> + beforeAll(async () => {
> +   await import('./dist/test-components/test-components.esm.js');
> + });
> ```

#### Method Spying

Spy on methods while still calling the original implementation:

```tsx
const { root, spies } = await render(<my-button>Click me</my-button>, {
  spyOn: {
    methods: ['handleClick'],
  },
});

// Trigger the method
root.shadowRoot?.querySelector('button')?.click();

// Assert the method was called
expect(spies?.methods.handleClick).toHaveBeenCalledTimes(1);
expect(spies?.methods.handleClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));

// Reset call history
spies?.methods.handleClick.mockClear();
```

#### Method Mocking

Replace methods with pre-configured mocks:

```tsx
// Create mock with desired return value *before* render
const fetchUserMock = vi.fn().mockResolvedValue({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
});

// Mock is applied before initialisation
const { root, spies, waitForChanges } = await render(<user-profile userId="123" />, {
  spyOn: {
    mocks: { fetchUserData: fetchUserMock },
  },
});
await waitForChanges();

expect(fetchUserMock).toHaveBeenCalledWith('123');
expect(root.shadowRoot?.querySelector('.name')?.textContent).toBe('Test User');
```

Access the original implementation to augment rather than fully replace:

```tsx
const fetchMock = vi.fn();
const { spies } = await render(<my-component />, {
  spyOn: { mocks: { fetchData: fetchMock } },
});

// Wrap the original to add logging or modify behaviour
fetchMock.mockImplementation(async (...args) => {
  console.log('Fetching data with args:', args);
  const result = await spies?.mocks.fetchData.original?.(...args);
  console.log('Got result:', result);
  return result;
});
```

#### Prop Spying

Track when props are changed:

```tsx
const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
  spyOn: {
    props: ['variant', 'disabled'],
  },
});

await setProps({ variant: 'danger' });
await waitForChanges();

expect(spies?.props.variant).toHaveBeenCalledWith('danger');
expect(spies?.props.variant).toHaveBeenCalledTimes(1);
```

#### Lifecycle Spying

Spy on lifecycle methods. Methods that don't exist on the component are auto-stubbed:

```tsx
const { spies, setProps, waitForChanges } = await render(<my-button>Click me</my-button>, {
  spyOn: {
    lifecycle: ['componentWillLoad', 'componentDidLoad', 'componentWillRender', 'componentDidRender'],
  },
});

// Lifecycle methods are called during initial render
expect(spies?.lifecycle.componentWillLoad).toHaveBeenCalledTimes(1);
expect(spies?.lifecycle.componentDidRender).toHaveBeenCalledTimes(1);

// Trigger a re-render
await setProps({ variant: 'danger' });
await waitForChanges();

// Re-render lifecycle methods called again
expect(spies?.lifecycle.componentWillRender).toHaveBeenCalledTimes(2);
expect(spies?.lifecycle.componentDidRender).toHaveBeenCalledTimes(2);
```

#### Resetting Spies

Reset all spies at once using `resetAll()`. This clears call histories AND resets mock implementations:

```tsx
const fetchMock = vi.fn().mockReturnValue('mocked');
const { root, spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
  spyOn: {
    methods: ['handleClick'],
    mocks: { fetchData: fetchMock },
    props: ['variant'],
  },
});

// Trigger some calls
root.shadowRoot?.querySelector('button')?.click();
await setProps({ variant: 'danger' });

// Reset everything
spies?.resetAll();

// Call histories cleared
expect(spies?.methods.handleClick).toHaveBeenCalledTimes(0);
expect(spies?.props.variant).toHaveBeenCalledTimes(0);

// Mock implementations reset to default (returns undefined)
expect(fetchMock()).toBeUndefined();
```

#### Nested Components

When the root element is not a custom element, or when you have multiple custom elements, use `getComponentSpies()` to retrieve spies for specific elements:

```tsx
import { render, getComponentSpies, h } from '@stencil/vitest';

// Root is a div, not a custom element
const { root } = await render(
  <div>
    <my-button>Click me</my-button>
  </div>,
  {
    spyOn: { methods: ['handleClick'] },
  },
);

// Query the nested custom element
const button = root.querySelector('my-button') as HTMLElement;

// Get spies for the nested element
const buttonSpies = getComponentSpies(button);
expect(buttonSpies?.methods.handleClick).toBeDefined();

// Multiple instances have independent spies
const { root: container } = await render(
  <div>
    <my-button class="a">A</my-button>
    <my-button class="b">B</my-button>
  </div>,
  { spyOn: { methods: ['handleClick'] } },
);

const spiesA = getComponentSpies(container.querySelector('.a') as HTMLElement);
const spiesB = getComponentSpies(container.querySelector('.b') as HTMLElement);

// Each has its own spy instance
container.querySelector('.a')?.shadowRoot?.querySelector('button')?.click();
expect(spiesA?.methods.handleClick).toHaveBeenCalledTimes(1);
expect(spiesB?.methods.handleClick).toHaveBeenCalledTimes(0);
```

#### Per-Component Configurations

When rendering multiple component types, use the `components` property for tag-specific spy configs:

```tsx
import { render, getComponentSpies, h } from '@stencil/vitest';

const { root } = await render(
  <my-card cardTitle="Test">
    <my-button slot="footer">Click me</my-button>
  </my-card>,
  {
    spyOn: {
      lifecycle: ['componentDidLoad'], // base - applies to all
      components: {
        'my-card': { props: ['cardTitle'] },
        'my-button': { methods: ['handleClick'] },
      },
    },
  },
);

const cardSpies = getComponentSpies(root);
const buttonSpies = getComponentSpies(root.querySelector('my-button') as HTMLElement);

// Both get base lifecycle spy + their specific config
expect(cardSpies?.lifecycle.componentDidLoad).toHaveBeenCalled();
expect(cardSpies?.props.cardTitle).toBeDefined();

expect(buttonSpies?.lifecycle.componentDidLoad).toHaveBeenCalled();
expect(buttonSpies?.methods.handleClick).toBeDefined();
```

### Event Testing

Test custom events emitted by your components:

```tsx
const { root, spyOnEvent, waitForChanges } = await render(<my-button />);

// Spy on events
const clickSpy = spyOnEvent('buttonClick');
const changeSpy = spyOnEvent('valueChange');

// Trigger events
root.click();
await waitForChanges();

// Assert events were emitted
expect(clickSpy).toHaveReceivedEvent();
expect(clickSpy).toHaveReceivedEventTimes(1);
expect(clickSpy).toHaveReceivedEventDetail({ buttonId: 'my-button' });

// Access event data
expect(clickSpy.events).toHaveLength(1);
expect(clickSpy.firstEvent?.detail).toEqual({ buttonId: 'my-button' });
expect(clickSpy.lastEvent?.detail).toEqual({ buttonId: 'my-button' });
```

## Snapshots

The package includes a custom snapshot serializer for Stencil components that properly handles shadow DOM:

```tsx
import { render, h } from '@stencil/vitest';
...
const { root } = await render(<my-component />);
expect(root).toMatchSnapshot();
```

**Snapshot output example:**

```html
<my-component>
  <mock:shadow-root>
    <button class="primary">
      <slot />
    </button>
  </mock:shadow-root>
  Click me
</my-component>
```

## Screenshot Testing

Browser tests can include screenshot comparisons using Vitest's screenshot capabilities:

```tsx
import { render, h } from '@stencil/vitest';
...
const { root } = await render(<my-button variant="primary">Primary Button</my-button>);
await expect(root).toMatchScreenshot();
```

Refer to Vitest's [screenshot testing documentation](https://vitest.dev/guide/snapshot.html#visual-snapshots) for more details.

## Utils

### `serializeHtml(element, options?)`

Serializes an HTML element to a string, including shadow DOM content. Useful for debugging or creating custom assertions.

```tsx
import { serializeHtml } from '@stencil/vitest';

const html = serializeHtml(element, {
  serializeShadowRoot: true, // Include shadow DOM (default: true)
  pretty: true, // Prettify output (default: true)
  excludeStyles: true, // Exclude <style> tags (default: true)
});
```

### `prettifyHtml(html)`

Formats HTML string with indentation for readability.

```tsx
import { prettifyHtml } from '@stencil/vitest';

const formatted = prettifyHtml('<div><span>Hello</span></div>');
// Returns:
// <div>
//   <span>
//     Hello
//   </span>
// </div>
```

### `waitForStable(elementOrSelector, timeout?)`

Waits for an element to be rendered and visible in the DOM. Only works in real browser environments (not jsdom/happy-dom).

Accepts either an `Element` or a CSS selector string. When a selector is provided, it polls until the element appears in the DOM.

```tsx
import { render, waitForStable, h } from '@stencil/vitest';

// Wait for a rendered element to be stable / visible
const { root } = await render(<my-component />);
await waitForStable(root);

// Wait for an element using a selector (useful when element isn't in DOM yet)
await waitForStable('my-component .inner-element');

// Custom timeout (default: 5000ms)
await waitForStable('my-component', 10000);
```

> **Note:** In non-browser environments, `waitForStable` logs a warning and returns immediately.

### `waitForExist(selector, timeout?)`

Waits for an element matching the selector to exist in the DOM. Unlike `waitForStable`, this works in both real browsers and mock DOM environments (jsdom/happy-dom).

Returns the element if found, or `null` if timeout is reached.

```tsx
import { waitForExist } from '@stencil/vitest';

// Wait for an element to appear in the DOM
const element = await waitForExist('my-component .lazy-loaded');

// Custom timeout (default: 5000ms)
const element = await waitForExist('#dynamic-content', 10000);
```

## CLI

The `stencil-test` CLI wraps both Stencil builds with Vitest testing.

### Add to package.json

```json
{
  "scripts": {
    "test": "stencil-test",
    "test:watch": "stencil-test --watch"
  }
}
```

### Usage

```bash
# Build once, test once
stencil-test

# Watch mode (rebuilds on component changes, interactive Vitest)
stencil-test --watch

# Watch mode with dev server
stencil-test --watch --serve

# Production build before testing
stencil-test --prod

# Pass arguments to Vitest
stencil-test --watch --coverage

# Test specific files
stencil-test button.spec.ts

# Test specific project
stencil-test --project browser
```

### CLI Options

The `stencil-test` CLI supports most of Stencil's CLI options and all of Vitest CLI options

- For full Stencil CLI options, see [Stencil CLI docs](https://stenciljs.com/docs/cli).
- For full Vitest CLI options, see [Vitest CLI docs](https://vitest.dev/guide/cli.html).

### Global Variables

The `stencil-test` CLI exposes global variables that can be accessed in your tests to check which CLI flags were used:

| Global              | Type      | Description                            |
| ------------------- | --------- | -------------------------------------- |
| `__STENCIL_PROD__`  | `boolean` | `true` when `--prod` flag is passed    |
| `__STENCIL_SERVE__` | `boolean` | `true` when `--serve` flag is passed   |
| `__STENCIL_PORT__`  | `string`  | Port number when `--port` is specified |

```tsx
if (__STENCIL_PROD__) {
  console.log('Running tests against production build');
}

if (__STENCIL_SERVE__) {
  const baseUrl = `http://localhost:${__STENCIL_PORT__ || '3333'}`;
}
```

#### TypeScript Support

Add to your `tsconfig.json` for type definitions:

```json
{
  "compilerOptions": {
    "types": ["@stencil/vitest/globals"]
  }
}
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.
