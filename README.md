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
expect(element).toHaveTextContent('Hello World');
expect(element).toEqualText('Exact text match');

// Shadow DOM
expect(element).toHaveShadowRoot();
await expect(element).toEqualHtml('<div>Expected HTML</div>');
await expect(element).toEqualLightHtml('<div>Light DOM only</div>');
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

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.
