import { describe, it, expect, render } from '@stencil/vitest';
import '../moo-poo';

describe('moo-poo', () => {
  it('renders', async () => {
    const { root } = await render(<moo-poo />);
    expect(root).toBeDefined();
  });
});
