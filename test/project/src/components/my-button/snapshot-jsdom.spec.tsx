import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - snapshot tests (jsdom)', () => {
  it('should match snapshot for primary button', async () => {
    const { root, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>);

    await waitForChanges();
    expect(root).toMatchSnapshot();
  });

  it('should match snapshot for card with nested button', async () => {
    const { root, waitForChanges } = await render(
      <my-card cardTitle="Test Card">
        <p>Card content</p>
        <my-button slot="footer" variant="primary">
          Action
        </my-button>
      </my-card>,
    );

    await waitForChanges();
    expect(root).toMatchSnapshot();
  });
});
