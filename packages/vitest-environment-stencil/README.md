# vitest-environment-stencil

A custom [Vitest environment](https://vitest.dev/guide/environment.html) for testing [Stencil](https://stenciljs.com/) components.

This package enables the `environment: 'stencil'` option in your Vitest configuration, providing a DOM environment optimized for Stencil component testing.

## Installation

```bash
npm install --save-dev vitest-environment-stencil @stencil/vitest vitest
```

## Usage

In your Vitest config, set the environment to `stencil`:

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@stencil/vitest/config';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    include: ['src/**/*.spec.{ts,tsx}'],
    environment: 'stencil',
  },
});
```

### Per-File Environment

You can also set the environment on a per-file basis using a comment directive at the top of your test file:

```typescript
// @vitest-environment stencil
import { render, h } from '@stencil/vitest';

describe('my-component', () => {
  // ...
});
```

This is useful when you have a mix of test types and only some need the Stencil environment.

### Environment Options

You can configure the underlying DOM implementation using `environmentOptions`:

```typescript
export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    environment: 'stencil',
    environmentOptions: {
      stencil: {
        // Choose your DOM implementation:
        // 'mock-doc' (default) - Stencil's built-in mock DOM
        // 'jsdom' - Full jsdom implementation (requires jsdom package)
        // 'happy-dom' - Fast happy-dom implementation (requires happy-dom package)
        domEnvironment: 'mock-doc',
      },
    },
  },
});
```

## Documentation

For full documentation, including testing APIs, matchers, and examples, see the [@stencil/vitest README](https://www.npmjs.com/package/@stencil/vitest).

## License

MIT
