import { describe, it, expect, render } from '@stencil/vitest';

describe('my-component', () => {
  it('renders', async () => {
    const { root } = await render(<my-component />);
    expect(root).toBeDefined();
  });
});
